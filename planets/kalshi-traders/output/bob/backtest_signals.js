#!/usr/bin/env node
/**
 * Backtest Signal Generator — T567
 * Walk-forward backtest of z-score mean reversion strategy.
 *
 * Approach:
 *   1. Generate 100-tick correlated price histories per market
 *   2. Split 70/30 into train/test periods
 *   3. Calibrate z-score parameters on training data
 *   4. Generate signals and simulate trades on test data (out-of-sample)
 *   5. Output per-pair and aggregate performance metrics
 *
 * Usage: node backtest_signals.js
 *
 * Following: D5 (runnable system), C8 (verify output), D2 (D004 north star)
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { calculateSpreadZScores, SIGNAL_CONFIG } = require("./signal_generator");

// ---------------------------------------------------------------------------
// Backtest Configuration
// ---------------------------------------------------------------------------
const BT_CONFIG = {
  priceHistoryLength: 100,  // 100 ticks per market
  trainPct: 0.7,            // 70% train, 30% test
  initialCapital: 100,
  tradingFee: 0.01,
  // Strategy params (same as signal_generator.js)
  zScoreEntry: SIGNAL_CONFIG.zScoreEntry,
  zScoreExit: SIGNAL_CONFIG.zScoreExit,
  zScoreStop: SIGNAL_CONFIG.zScoreStop,
  maxPositionSize: SIGNAL_CONFIG.maxPositionSize,
  basePositionSize: SIGNAL_CONFIG.basePositionSize,
};

// ---------------------------------------------------------------------------
// Correlated Price Generator (extended to 100 ticks)
// ---------------------------------------------------------------------------
function generateExtendedPriceData(pairs) {
  const priceData = {};
  const allTickers = new Set();
  for (const pair of pairs) {
    allTickers.add(pair.market_a);
    allTickers.add(pair.market_b);
  }

  const marketFactors = {};
  function getMarketFactor(category) {
    if (marketFactors[category]) return marketFactors[category];
    const seed = category.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const seededRandom = (n) => {
      const x = Math.sin(seed + n * 7.13) * 10000;
      return x - Math.floor(x);
    };
    const factors = [];
    for (let i = 0; i < BT_CONFIG.priceHistoryLength; i++) {
      factors.push((seededRandom(i) - 0.5) * 6);
    }
    marketFactors[category] = factors;
    return factors;
  }

  for (const ticker of allTickers) {
    const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const seededRandom = (n) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };

    let category = "other", basePrice = 50;
    if (ticker.includes("BTC") || ticker.includes("ETH") || ticker.includes("SOL")) {
      category = "crypto"; basePrice = ticker.includes("BTC") ? 65 : ticker.includes("ETH") ? 35 : 45;
    } else if (ticker.includes("INXW") || ticker.includes("GDP") || ticker.includes("CPI")) {
      category = "economics"; basePrice = ticker.includes("INXW") ? 75 : 25;
    } else if (ticker.includes("KXNF") || ticker.includes("NFP")) {
      category = "nfp"; basePrice = 26;
    } else if (ticker.includes("FED")) {
      category = "rates"; basePrice = 45;
    } else if (ticker.includes("OIL")) {
      category = "commodities"; basePrice = 22;
    }

    const sharedFactor = getMarketFactor(category);
    const prices = [basePrice];
    for (let i = 1; i < BT_CONFIG.priceHistoryLength; i++) {
      // Regime changes: occasionally decouple from shared factor (realistic)
      // This creates the spread divergences that z-score strategy trades on
      const regimeShift = (seededRandom(i * 3 + 7) < 0.15) ? (seededRandom(i * 5) - 0.5) * 8 : 0;
      const shared = sharedFactor[i] * 0.7;
      const noise = (seededRandom(i) - 0.5) * 4 * 0.3 + regimeShift;
      const newPrice = Math.max(5, Math.min(95, prices[i - 1] + shared + noise));
      prices.push(Math.round(newPrice));
    }
    priceData[ticker] = prices;
  }

  return priceData;
}

// ---------------------------------------------------------------------------
// Walk-Forward Backtest
// ---------------------------------------------------------------------------
function backtestPair(tickerA, tickerB, pricesA, pricesB, cluster, correlation, confidence) {
  const n = Math.min(pricesA.length, pricesB.length);
  const splitIdx = Math.floor(n * BT_CONFIG.trainPct);

  // Training period: calibrate spread statistics
  const trainA = pricesA.slice(0, splitIdx);
  const trainB = pricesB.slice(0, splitIdx);
  const { spreads: trainSpreads } = calculateSpreadZScores(trainA, trainB, 20);

  // Calculate training-period spread mean and std
  const validSpreads = trainSpreads.filter(s => s !== undefined && !isNaN(s));
  if (validSpreads.length < 10) {
    return { pair: `${tickerA}:${tickerB}`, skipped: true, reason: "insufficient training data" };
  }
  const trainMean = validSpreads.reduce((a, b) => a + b, 0) / validSpreads.length;
  const trainVariance = validSpreads.reduce((s, v) => s + (v - trainMean) ** 2, 0) / validSpreads.length;
  const trainStd = Math.sqrt(trainVariance) || 0.001;

  // Test period: generate signals using training-period parameters
  const testA = pricesA.slice(splitIdx);
  const testB = pricesB.slice(splitIdx);

  // Calculate test spreads using same normalization base as training
  const baseA = pricesA[0] || 1;
  const baseB = pricesB[0] || 1;
  const testSpreads = [];
  for (let i = 0; i < testA.length; i++) {
    const normA = (testA[i] - baseA) / baseA;
    const normB = (testB[i] - baseB) / baseB;
    testSpreads.push(normA - normB);
  }

  // Generate z-scores using training-period stats (out-of-sample)
  const testZScores = testSpreads.map(s => (s - trainMean) / trainStd);

  // Simulate trades on test period
  const trades = [];
  let inPosition = false;
  let posDirection = null;
  let entryIdx = -1;
  let entrySpread = 0;

  for (let i = 0; i < testZScores.length; i++) {
    const z = testZScores[i];

    if (!inPosition) {
      if (z > BT_CONFIG.zScoreEntry) {
        inPosition = true;
        posDirection = "short_spread";
        entryIdx = i;
        entrySpread = testSpreads[i];
      } else if (z < -BT_CONFIG.zScoreEntry) {
        inPosition = true;
        posDirection = "long_spread";
        entryIdx = i;
        entrySpread = testSpreads[i];
      }
    } else {
      let exitReason = null;
      if (Math.abs(z) < BT_CONFIG.zScoreExit) {
        exitReason = "mean_reversion";
      } else if (Math.abs(z) > BT_CONFIG.zScoreStop) {
        exitReason = "stop_loss";
      }

      if (exitReason) {
        const exitSpread = testSpreads[i];
        const spreadChange = exitSpread - entrySpread;
        const isShort = posDirection === "short_spread";
        const rawPnl = isShort ? -spreadChange : spreadChange;
        const contracts = Math.max(1, Math.min(BT_CONFIG.maxPositionSize, Math.round(BT_CONFIG.basePositionSize * confidence)));
        const pnlCents = rawPnl * 100 * contracts;
        const fees = BT_CONFIG.tradingFee * contracts * 2;
        const netPnl = (pnlCents / 100) - fees;

        trades.push({
          entry_tick: splitIdx + entryIdx,
          exit_tick: splitIdx + i,
          holding_period: i - entryIdx,
          direction: posDirection,
          entry_z: parseFloat(testZScores[entryIdx].toFixed(3)),
          exit_z: parseFloat(z.toFixed(3)),
          exit_reason: exitReason,
          contracts,
          pnl: parseFloat(netPnl.toFixed(4)),
        });

        inPosition = false;
        posDirection = null;
      }
    }
  }

  // Aggregate stats
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const meanReverts = trades.filter(t => t.exit_reason === "mean_reversion").length;
  const stops = trades.filter(t => t.exit_reason === "stop_loss").length;

  return {
    pair: `${tickerA}:${tickerB}`,
    cluster,
    correlation: parseFloat(correlation.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(4)),
    skipped: false,
    train_period: { start: 0, end: splitIdx, ticks: splitIdx },
    test_period: { start: splitIdx, end: n, ticks: n - splitIdx },
    train_spread_mean: parseFloat(trainMean.toFixed(6)),
    train_spread_std: parseFloat(trainStd.toFixed(6)),
    total_trades: trades.length,
    wins,
    losses,
    win_rate: trades.length > 0 ? parseFloat((wins / trades.length).toFixed(4)) : 0,
    total_pnl: parseFloat(totalPnl.toFixed(4)),
    avg_pnl: trades.length > 0 ? parseFloat((totalPnl / trades.length).toFixed(4)) : 0,
    mean_reversion_exits: meanReverts,
    stop_loss_exits: stops,
    avg_holding_period: trades.length > 0 ? parseFloat((trades.reduce((s, t) => s + t.holding_period, 0) / trades.length).toFixed(1)) : 0,
    trades,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function runBacktest() {
  // Load correlation pairs from pipeline output
  const cpPath = path.join(__dirname, "../../../public/correlation_pairs.json");
  if (!fs.existsSync(cpPath)) {
    console.error("correlation_pairs.json not found. Run: node run_pipeline.js first.");
    process.exit(1);
  }
  const correlationPairs = JSON.parse(fs.readFileSync(cpPath, "utf8"));
  const arbPairs = (correlationPairs.pairs || []).filter(p => p.is_arbitrage_opportunity);

  console.log("=".repeat(60));
  console.log("WALK-FORWARD BACKTEST — T567");
  console.log("Z-Score Mean Reversion Strategy");
  console.log("=".repeat(60));
  console.log(`Input: ${arbPairs.length} arbitrage pairs from Phase 3`);
  console.log(`Config: ${BT_CONFIG.priceHistoryLength} ticks, ${Math.round(BT_CONFIG.trainPct * 100)}/${Math.round((1 - BT_CONFIG.trainPct) * 100)} train/test split`);
  console.log(`Strategy: z_entry=${BT_CONFIG.zScoreEntry}, z_exit=${BT_CONFIG.zScoreExit}, z_stop=${BT_CONFIG.zScoreStop}\n`);

  // Generate extended price data
  const priceData = generateExtendedPriceData(arbPairs);
  console.log(`Generated ${Object.keys(priceData).length} price series (${BT_CONFIG.priceHistoryLength} ticks each)\n`);

  // Backtest each pair
  const pairResults = [];
  for (const pair of arbPairs) {
    const pricesA = priceData[pair.market_a];
    const pricesB = priceData[pair.market_b];
    if (!pricesA || !pricesB) continue;

    const result = backtestPair(
      pair.market_a, pair.market_b,
      pricesA, pricesB,
      pair.cluster, pair.pearson_correlation, pair.arbitrage_confidence
    );
    pairResults.push(result);

    if (result.skipped) {
      console.log(`  ${result.pair}: SKIPPED (${result.reason})`);
    } else {
      console.log(`  ${result.pair}: ${result.total_trades} trades, WR ${(result.win_rate * 100).toFixed(0)}%, P&L $${result.total_pnl.toFixed(2)}`);
    }
  }

  // Aggregate results
  const activePairs = pairResults.filter(r => !r.skipped);
  const totalTrades = activePairs.reduce((s, r) => s + r.total_trades, 0);
  const totalWins = activePairs.reduce((s, r) => s + r.wins, 0);
  const totalPnl = activePairs.reduce((s, r) => s + r.total_pnl, 0);
  const totalMeanReverts = activePairs.reduce((s, r) => s + r.mean_reversion_exits, 0);
  const totalStops = activePairs.reduce((s, r) => s + r.stop_loss_exits, 0);

  const report = {
    generated_at: new Date().toISOString(),
    task: "T567",
    strategy: "z_score_mean_reversion",
    backtest_config: BT_CONFIG,
    summary: {
      total_pairs: arbPairs.length,
      active_pairs: activePairs.length,
      skipped_pairs: pairResults.filter(r => r.skipped).length,
      total_trades: totalTrades,
      total_wins: totalWins,
      total_losses: totalTrades - totalWins,
      win_rate: totalTrades > 0 ? parseFloat((totalWins / totalTrades).toFixed(4)) : 0,
      total_pnl: parseFloat(totalPnl.toFixed(4)),
      avg_pnl_per_trade: totalTrades > 0 ? parseFloat((totalPnl / totalTrades).toFixed(4)) : 0,
      mean_reversion_exits: totalMeanReverts,
      stop_loss_exits: totalStops,
      profitable_pairs: activePairs.filter(r => r.total_pnl > 0).length,
      losing_pairs: activePairs.filter(r => r.total_pnl <= 0).length,
    },
    per_pair_results: pairResults,
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKTEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Pairs: ${report.summary.active_pairs} active / ${report.summary.skipped_pairs} skipped`);
  console.log(`Trades: ${report.summary.total_trades} (${report.summary.total_wins}W / ${report.summary.total_losses}L)`);
  console.log(`Win rate: ${(report.summary.win_rate * 100).toFixed(1)}%`);
  console.log(`Total P&L: $${report.summary.total_pnl.toFixed(2)}`);
  console.log(`Avg P&L/trade: $${report.summary.avg_pnl_per_trade.toFixed(4)}`);
  console.log(`Exit types: ${report.summary.mean_reversion_exits} mean-revert, ${report.summary.stop_loss_exits} stop-loss`);
  console.log(`Profitable pairs: ${report.summary.profitable_pairs}/${report.summary.active_pairs}`);

  // Write report
  const reportPath = path.join(__dirname, "backtest_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);

  return report;
}

if (require.main === module) {
  // Need pipeline output first
  const cpPath = path.join(__dirname, "../../../public/correlation_pairs.json");
  if (!fs.existsSync(cpPath)) {
    console.log("Running pipeline first to generate correlation pairs...\n");
    const { main } = require("./run_pipeline");
    main().then(() => runBacktest());
  } else {
    runBacktest();
  }
}

module.exports = { runBacktest };
