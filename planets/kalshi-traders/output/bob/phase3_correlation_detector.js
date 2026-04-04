#!/usr/bin/env node
/**
 * Phase 3 — Pearson Correlation Detection (Data-Chain Verified)
 *
 * T535: Re-run Pearson correlation on corrected cluster data.
 * CRITICAL: Every ticker MUST trace back to Phase 1 markets_filtered.json.
 *
 * Input:  public/markets_filtered.json (Phase 1), public/market_clusters.json (Phase 2)
 * Output: public/correlation_pairs.json, output/bob/correlation_pairs.json
 *
 * Author: Bob (Backend Engineer)
 * Following: D2 (D004 north star), C6 (knowledge.md Phase 3 spec)
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const MARKETS_PATH = path.join(ROOT, "shared/markets_filtered.json");
const CLUSTERS_PATH = path.join(ROOT, "agents/public/market_clusters.json");
const OUTPUT_PUBLIC = path.join(ROOT, "agents/public/correlation_pairs.json");
const OUTPUT_BOB = path.join(__dirname, "correlation_pairs.json");

// --- Phase 1 Data Chain Validation ---

function loadPhase1Markets() {
  const raw = JSON.parse(fs.readFileSync(MARKETS_PATH, "utf8"));
  const qualifying = raw.qualifying_markets || [];
  if (qualifying.length === 0) {
    throw new Error("No qualifying markets in markets_filtered.json — Phase 1 incomplete");
  }
  console.log(`[Phase 1] ${qualifying.length} qualifying markets loaded`);
  qualifying.forEach(m => console.log(`  - ${m.ticker} (${m.category}) yes_ratio=${m.yes_ratio}`));
  return qualifying;
}

function loadPhase2Clusters(allowedTickers) {
  const raw = JSON.parse(fs.readFileSync(CLUSTERS_PATH, "utf8"));
  const clusters = raw.clusters || [];

  // Validate every clustered ticker traces back to Phase 1
  const violations = [];
  for (const cluster of clusters) {
    for (const ticker of cluster.markets) {
      if (!allowedTickers.has(ticker)) {
        violations.push({ cluster: cluster.id, ticker });
      }
    }
  }

  if (violations.length > 0) {
    console.warn(`[Phase 2] DATA CHAIN VIOLATIONS (${violations.length}):`);
    violations.forEach(v => console.warn(`  ✗ ${v.ticker} in cluster ${v.cluster} — NOT in Phase 1`));
    console.warn("[Phase 2] Filtering out non-Phase-1 tickers from clusters");

    // Filter clusters to only include Phase 1 tickers
    for (const cluster of clusters) {
      cluster.markets = cluster.markets.filter(t => allowedTickers.has(t));
    }
  }

  // Remove empty clusters
  const validClusters = clusters.filter(c => c.markets.length > 0);
  console.log(`[Phase 2] ${validClusters.length} valid clusters after filtering`);
  validClusters.forEach(c => console.log(`  - ${c.label}: [${c.markets.join(", ")}]`));
  return validClusters;
}

// --- Synthetic Price Generation (pending T236 real API) ---

function generateSyntheticPrices(market, nPeriods) {
  // Seed from ticker hash for reproducibility
  let seed = 0;
  for (const ch of market.ticker) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  const basePrice = market.yes_ratio || 50;
  const prices = [];
  let price = basePrice;
  for (let i = 0; i < nPeriods; i++) {
    const drift = (rng() - 0.5) * 4;
    price = Math.max(1, Math.min(99, price + drift));
    prices.push(Math.round(price * 100) / 100);
  }
  return prices;
}

// --- Pearson Correlation ---

function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n !== y.length || n < 3) return { r: 0, t: 0, significant: false };

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  if (denom === 0) return { r: 0, t: 0, significant: false };

  const r = sumXY / denom;
  const t = r * Math.sqrt((n - 2) / (1 - r * r + 1e-10));
  // t-critical for df=n-2, alpha=0.05 two-tailed ≈ 2.0 for n=60
  const tCritical = 2.0;

  return { r: Math.round(r * 10000) / 10000, t: Math.round(t * 100) / 100, significant: Math.abs(t) > tCritical };
}

// --- Spread Analysis ---

function analyzeSpread(pricesA, pricesB) {
  const spreads = pricesA.map((p, i) => p - pricesB[i]);
  const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const variance = spreads.reduce((a, s) => a + (s - mean) ** 2, 0) / spreads.length;
  const std = Math.sqrt(variance);
  const currentSpread = spreads[spreads.length - 1];
  const zscore = std > 0 ? (currentSpread - mean) / std : 0;

  return {
    mean: Math.round(mean * 100) / 100,
    std: Math.round(std * 100) / 100,
    zscore: Math.round(zscore * 100) / 100,
    currentSpread: Math.round(currentSpread * 100) / 100
  };
}

// --- Main ---

function run() {
  console.log("=== Phase 3: Pearson Correlation Detection (Data-Chain Verified) ===\n");

  const N_PERIODS = 60;
  const Z_THRESHOLD = 1.5;

  // Step 1: Load Phase 1 qualifying markets
  const markets = loadPhase1Markets();
  const allowedTickers = new Set(markets.map(m => m.ticker));

  // Step 2: Load Phase 2 clusters (filtered to Phase 1 tickers only)
  console.log("");
  const clusters = loadPhase2Clusters(allowedTickers);

  // Step 3: Generate synthetic price histories
  console.log(`\n[Phase 3] Generating ${N_PERIODS}-period synthetic price histories...`);
  const priceData = {};
  for (const m of markets) {
    priceData[m.ticker] = generateSyntheticPrices(m, N_PERIODS);
  }

  // Step 4: Compute all pairwise correlations
  console.log("[Phase 3] Computing pairwise Pearson correlations...\n");
  const allPairs = [];
  const tickers = markets.map(m => m.ticker);

  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const t1 = tickers[i], t2 = tickers[j];
      const m1 = markets[i], m2 = markets[j];
      const p1 = priceData[t1], p2 = priceData[t2];

      const { r, t, significant } = pearsonCorrelation(p1, p2);
      const spread = analyzeSpread(p1, p2);

      // Determine source (intra-cluster or cross-cluster)
      let source = "cross_cluster";
      let clusterName = "cross_domain";
      for (const c of clusters) {
        if (c.markets.includes(t1) && c.markets.includes(t2)) {
          source = "intra_cluster";
          clusterName = c.label;
          break;
        }
      }

      // Arbitrage signal
      let arbSignal = "NO_SIGNAL";
      let arbDetail = `Spread within normal range (Z=${spread.zscore}, threshold=±${Z_THRESHOLD})`;
      let edgeCents = 0;
      let confDiscount = 0;

      if (Math.abs(spread.zscore) > Z_THRESHOLD) {
        arbSignal = spread.zscore < 0 ? "BUY_SPREAD" : "SELL_SPREAD";
        arbDetail = spread.zscore < 0
          ? `Spread undervalued: buy ${t1}, sell ${t2}`
          : `Spread overvalued: sell ${t1}, buy ${t2}`;
        edgeCents = Math.round(Math.abs(spread.zscore - (spread.zscore > 0 ? Z_THRESHOLD : -Z_THRESHOLD)) * spread.std * 100) / 100;
        confDiscount = Math.abs(r);
      }

      // Confidence composite
      const corrStrength = Math.abs(r);
      const sigScore = significant ? 1.0 : 0.3;
      const spreadStability = spread.std > 0 ? Math.min(1.0, 5 / spread.std) : 0;
      const confidence = Math.round((corrStrength * 0.4 + sigScore * 0.3 + spreadStability * 0.3) * 100) / 100;

      const pair = {
        market1: t1,
        market2: t2,
        market1_title: m1.title,
        market2_title: m2.title,
        categories: [m1.category, m2.category],
        pearson_r: r,
        t_statistic: t,
        statistically_significant: significant,
        n_periods: N_PERIODS,
        spread_zscore: spread.zscore,
        spread_mean: spread.mean,
        spread_std: spread.std,
        current_prices: { [t1]: m1.yes_ratio, [t2]: m2.yes_ratio },
        arbitrage: {
          signal: arbSignal,
          signal_detail: arbDetail,
          estimated_edge_cents: edgeCents,
          z_threshold: Z_THRESHOLD,
          confidence_discount: confDiscount
        },
        confidence,
        confidence_components: {
          correlation_strength: corrStrength,
          statistical_significance: sigScore,
          spread_stability: Math.round(spreadStability * 100) / 100
        },
        source,
        cluster: clusterName,
        data_chain_verified: true
      };

      allPairs.push(pair);

      const sig = significant ? "✓ SIG" : "  n.s.";
      const arb = arbSignal !== "NO_SIGNAL" ? ` → ${arbSignal} (${edgeCents}¢)` : "";
      console.log(`  ${t1} ↔ ${t2}: r=${r}, t=${t} ${sig}${arb}`);
    }
  }

  const arbCandidates = allPairs.filter(p => p.arbitrage.signal !== "NO_SIGNAL");

  // Step 5: Data chain verification summary
  console.log("\n[Data Chain Verification]");
  const allOutputTickers = new Set();
  allPairs.forEach(p => { allOutputTickers.add(p.market1); allOutputTickers.add(p.market2); });
  let chainValid = true;
  for (const ticker of allOutputTickers) {
    const inPhase1 = allowedTickers.has(ticker);
    console.log(`  ${inPhase1 ? "✓" : "✗"} ${ticker} → Phase 1: ${inPhase1}`);
    if (!inPhase1) chainValid = false;
  }
  console.log(`  Data chain integrity: ${chainValid ? "PASS ✓" : "FAIL ✗"}`);

  // Step 6: Build output
  const output = {
    generated_at: new Date().toISOString(),
    task: "T535",
    phase: "D004 Phase 3 — Pearson Correlation Detection (Data-Chain Verified)",
    method: "Pearson pairwise correlation with spread Z-score",
    data_chain: {
      phase1_source: "public/markets_filtered.json",
      phase2_source: "public/market_clusters.json",
      all_tickers_verified: chainValid,
      qualifying_tickers: [...allowedTickers]
    },
    parameters: {
      n_periods: N_PERIODS,
      z_threshold: Z_THRESHOLD,
      significance_level: 0.05,
      note: "Synthetic price data — real validation pending T236 (Kalshi API credentials)"
    },
    all_pairs: allPairs,
    arbitrage_candidates: arbCandidates,
    summary: {
      total_pairs_analyzed: allPairs.length,
      significant_correlations: allPairs.filter(p => p.statistically_significant).length,
      arbitrage_signals: arbCandidates.length,
      pairs_by_source: {
        intra_cluster: allPairs.filter(p => p.source === "intra_cluster").length,
        cross_cluster: allPairs.filter(p => p.source === "cross_cluster").length
      }
    }
  };

  // Step 7: Write output
  fs.writeFileSync(OUTPUT_PUBLIC, JSON.stringify(output, null, 2));
  fs.writeFileSync(OUTPUT_BOB, JSON.stringify(output, null, 2));

  console.log(`\n[Output]`);
  console.log(`  Written: ${OUTPUT_PUBLIC}`);
  console.log(`  Written: ${OUTPUT_BOB}`);
  console.log(`\n=== Summary ===`);
  console.log(`  Pairs analyzed: ${output.summary.total_pairs_analyzed}`);
  console.log(`  Significant correlations: ${output.summary.significant_correlations}`);
  console.log(`  Arbitrage signals: ${output.summary.arbitrage_signals}`);
  console.log(`  Data chain: ${chainValid ? "VERIFIED ✓" : "BROKEN ✗"}`);
}

run();
