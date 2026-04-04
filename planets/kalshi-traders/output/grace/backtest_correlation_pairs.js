#!/usr/bin/env node
/**
 * T530 — Backtest Correlation Pairs & Validate Data Pipeline End-to-End
 *
 * Validates the full D004 pipeline:
 *   Phase 1: markets_filtered.json (Grace)
 *   Phase 2: market_clusters.json (Ivan)
 *   Phase 3: correlation_pairs.json (Bob)
 *
 * Then backtests top correlation pairs with simulated historical spread data.
 *
 * Usage: node agents/grace/output/backtest_correlation_pairs.js
 */

const fs = require('fs');
const path = require('path');

// output/ is symlinked: agents/grace/output -> ../../output/grace
// __dirname resolves to the real path, so we find agents/public/ relative to that
const PLANET_ROOT = path.join(__dirname, '..', '..');
const AGENTS_PUBLIC = path.join(PLANET_ROOT, 'agents', 'public');
// Fallback: public/ symlink -> shared/
const PUBLIC = fs.existsSync(path.join(AGENTS_PUBLIC, 'markets_filtered.json'))
  ? AGENTS_PUBLIC
  : path.join(PLANET_ROOT, 'public');
const OUTPUT = __dirname;

// --- Pipeline Validation ---

function loadJSON(filePath, label) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `${label}: FILE NOT FOUND at ${filePath}` };
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { ok: true, data, label };
  } catch (e) {
    return { ok: false, error: `${label}: PARSE ERROR — ${e.message}` };
  }
}

function validateMarketsFiltered(result) {
  const checks = [];
  if (!result.ok) return [{ check: 'File exists', pass: false, detail: result.error }];

  const d = result.data;
  checks.push({ check: 'File exists & parses', pass: true, detail: `Generated at ${d.generated_at}` });
  checks.push({ check: 'Has qualifying_markets array', pass: Array.isArray(d.qualifying_markets), detail: `${(d.qualifying_markets || []).length} markets` });
  checks.push({ check: 'At least 1 qualifying market', pass: (d.qualifying_markets || []).length >= 1, detail: `${(d.qualifying_markets || []).length} found` });

  // Schema checks on each market
  const requiredFields = ['id', 'ticker', 'category', 'volume', 'yes_ratio'];
  const markets = d.qualifying_markets || [];
  const allHaveFields = markets.every(m => requiredFields.every(f => m[f] !== undefined));
  checks.push({ check: 'All markets have required fields', pass: allHaveFields, detail: requiredFields.join(', ') });

  // Volume filter check
  const allAboveMinVolume = markets.every(m => m.volume >= 10000);
  checks.push({ check: 'All markets volume >= 10,000', pass: allAboveMinVolume, detail: markets.map(m => `${m.ticker}: ${m.volume}`).join(', ') });

  // Yes ratio not in excluded middle range (40-60%)
  const noneInMiddle = markets.every(m => m.yes_ratio < 40 || m.yes_ratio > 60);
  checks.push({ check: 'No markets in excluded 40-60% range', pass: noneInMiddle, detail: markets.map(m => `${m.ticker}: ${m.yes_ratio}%`).join(', ') });

  return checks;
}

function validateMarketClusters(result, filteredMarkets) {
  const checks = [];
  if (!result.ok) return [{ check: 'File exists', pass: false, detail: result.error }];

  const d = result.data;
  checks.push({ check: 'File exists & parses', pass: true, detail: `Generated at ${d.generated_at}` });
  checks.push({ check: 'Has clusters array', pass: Array.isArray(d.clusters), detail: `${(d.clusters || []).length} clusters` });

  // Check cluster structure
  const clusters = d.clusters || [];
  const allHaveFields = clusters.every(c => c.id && c.label && Array.isArray(c.markets));
  checks.push({ check: 'All clusters have id, label, markets', pass: allHaveFields, detail: clusters.map(c => c.id).join(', ') });

  // Check clustered markets reference filtered markets
  const filteredTickers = new Set((filteredMarkets || []).map(m => m.ticker));
  const clusteredMarkets = clusters.flatMap(c => c.markets);
  const allReferenceFiltered = clusteredMarkets.every(t => filteredTickers.has(t));
  checks.push({ check: 'Clustered markets exist in filtered set', pass: allReferenceFiltered, detail: `${clusteredMarkets.length} clustered, ${filteredTickers.size} filtered` });

  return checks;
}

function normalizeCorrelationData(d) {
  // Handle two known formats:
  // Format A (Bob output/): { pairs: [{ market_a, market_b, pearson_correlation, ... }] }
  // Format B (agents/public/): { all_pairs: [{ market1, market2, pearson_r, ... }], arbitrage_candidates: [...] }
  if (d.pairs) return { allPairs: d.pairs, opportunities: d.pairs.filter(p => p.is_arbitrage_opportunity), format: 'A' };

  const allPairs = (d.all_pairs || []).map(p => ({
    market_a: p.market1, market_b: p.market2,
    cluster: p.cluster,
    pearson_correlation: p.pearson_r,
    expected_spread: p.spread_mean,
    current_spread: p.current_prices ? (p.current_prices[p.market1] - p.current_prices[p.market2]) : 0,
    spread_deviation: Math.abs(p.spread_zscore || 0),
    arbitrage_confidence: p.confidence,
    direction: p.arbitrage ? p.arbitrage.signal : 'NONE',
    is_arbitrage_opportunity: p.arbitrage && p.arbitrage.signal !== 'NO_SIGNAL',
    edge_cents: p.arbitrage ? p.arbitrage.estimated_edge_cents : 0
  }));
  return { allPairs, opportunities: allPairs.filter(p => p.is_arbitrage_opportunity), format: 'B' };
}

function validateCorrelationPairs(result) {
  const checks = [];
  if (!result.ok) return [{ check: 'File exists', pass: false, detail: result.error }];

  const d = result.data;
  checks.push({ check: 'File exists & parses', pass: true, detail: `Generated at ${d.generated_at}` });

  const norm = normalizeCorrelationData(d);
  checks.push({ check: 'Has pairs data', pass: norm.allPairs.length > 0, detail: `${norm.allPairs.length} pairs (format ${norm.format})` });

  const pairs = norm.allPairs;
  // Check pair structure
  const requiredFields = ['market_a', 'market_b', 'pearson_correlation', 'arbitrage_confidence'];
  const allHaveFields = pairs.every(p => requiredFields.every(f => p[f] !== undefined));
  checks.push({ check: 'All pairs have required fields', pass: allHaveFields, detail: requiredFields.join(', ') });

  // Correlation values in valid range [-1, 1]
  const allValidCorr = pairs.every(p => p.pearson_correlation >= -1 && p.pearson_correlation <= 1);
  checks.push({ check: 'Correlation values in [-1, 1]', pass: allValidCorr, detail: pairs.map(p => p.pearson_correlation.toFixed(3)).join(', ') });

  // Confidence values in valid range [0, 1]
  const allValidConf = pairs.every(p => p.arbitrage_confidence >= 0 && p.arbitrage_confidence <= 1);
  checks.push({ check: 'Confidence values in [0, 1]', pass: allValidConf, detail: 'All valid' });

  // At least one arbitrage opportunity
  checks.push({ check: 'At least 1 arbitrage opportunity', pass: norm.opportunities.length >= 1, detail: `${norm.opportunities.length} opportunities found` });

  return checks;
}

// --- Backtest Engine ---

function generateHistoricalSpreads(pair, days = 30) {
  // Simulate historical spread data using mean-reverting process
  const spreads = [];
  const mean = pair.expected_spread;
  const volatility = Math.abs(pair.current_spread - pair.expected_spread) * 0.5;
  let current = mean;

  // Seed RNG deterministically from pair name
  let seed = 0;
  for (const c of (pair.market_a + pair.market_b)) seed = ((seed << 5) - seed + c.charCodeAt(0)) | 0;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  for (let i = 0; i < days; i++) {
    const meanReversion = 0.1 * (mean - current);
    const noise = (rng() - 0.5) * 2 * volatility;
    current += meanReversion + noise;
    spreads.push({ day: i + 1, spread: current });
  }
  return spreads;
}

function backtestPair(pair) {
  const history = generateHistoricalSpreads(pair, 30);
  const threshold = Math.abs(pair.expected_spread) + 0.02; // Entry when spread deviates > threshold

  let trades = [];
  let inTrade = false;
  let entrySpread = 0;
  let entryDay = 0;

  for (const { day, spread } of history) {
    const deviation = spread - pair.expected_spread;

    if (!inTrade && Math.abs(deviation) > threshold) {
      // Enter trade — bet on mean reversion
      inTrade = true;
      entrySpread = spread;
      entryDay = day;
    } else if (inTrade) {
      const currentDeviation = spread - pair.expected_spread;
      // Exit when spread reverts past mean or after 5 days
      if (Math.abs(currentDeviation) < threshold * 0.3 || day - entryDay >= 5) {
        const pnl = (entrySpread > pair.expected_spread)
          ? (entrySpread - spread) // Sold high, buy back low
          : (spread - entrySpread); // Bought low, sell high
        trades.push({ entry: entryDay, exit: day, entrySpread, exitSpread: spread, pnl });
        inTrade = false;
      }
    }
  }

  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const hitRate = trades.length > 0 ? wins / trades.length : 0;
  const avgPnl = trades.length > 0 ? totalPnl / trades.length : 0;
  const maxDrawdown = trades.reduce((dd, t) => Math.min(dd, t.pnl), 0);

  return {
    pair: `${pair.market_a} / ${pair.market_b}`,
    cluster: pair.cluster,
    correlation: pair.pearson_correlation,
    confidence: pair.arbitrage_confidence,
    tradeCount: trades.length,
    wins, losses, hitRate,
    totalPnl, avgPnl, maxDrawdown,
    trades
  };
}

// --- Main ---

function main() {
  console.log('=== T530: Backtest Correlation Pairs & Pipeline Validation ===\n');

  // Load all pipeline data
  const filtered = loadJSON(path.join(PUBLIC, 'markets_filtered.json'), 'Phase 1: markets_filtered.json');
  const clusters = loadJSON(path.join(PUBLIC, 'market_clusters.json'), 'Phase 2: market_clusters.json');
  const corrPairs = loadJSON(path.join(PUBLIC, 'correlation_pairs.json'), 'Phase 3: correlation_pairs.json');

  // === PIPELINE VALIDATION ===
  console.log('--- Phase 1: Market Filtering (Grace) ---');
  const p1Checks = validateMarketsFiltered(filtered);
  p1Checks.forEach(c => console.log(`  ${c.pass ? 'PASS' : 'FAIL'} | ${c.check} — ${c.detail}`));

  console.log('\n--- Phase 2: LLM Clustering (Ivan) ---');
  const p2Checks = validateMarketClusters(clusters, filtered.ok ? filtered.data.qualifying_markets : []);
  p2Checks.forEach(c => console.log(`  ${c.pass ? 'PASS' : 'FAIL'} | ${c.check} — ${c.detail}`));

  console.log('\n--- Phase 3: Correlation Pairs (Bob) ---');
  const p3Checks = validateCorrelationPairs(corrPairs);
  p3Checks.forEach(c => console.log(`  ${c.pass ? 'PASS' : 'FAIL'} | ${c.check} — ${c.detail}`));

  const allChecks = [...p1Checks, ...p2Checks, ...p3Checks];
  const passed = allChecks.filter(c => c.pass).length;
  const failed = allChecks.filter(c => !c.pass).length;

  console.log(`\n=== Pipeline Validation: ${passed}/${allChecks.length} passed, ${failed} failed ===\n`);

  if (!corrPairs.ok) {
    console.log('ERROR: Cannot backtest without correlation_pairs.json');
    process.exit(1);
  }

  // === BACKTEST ===
  console.log('--- Backtesting Top Correlation Pairs (30-day simulated history) ---\n');

  const norm = normalizeCorrelationData(corrPairs.data);
  // Backtest all pairs (opportunities get priority, but include all for completeness)
  const opportunities = norm.opportunities.length > 0 ? norm.opportunities : norm.allPairs;
  if (opportunities.length === 0) {
    console.log('No pairs available for backtesting.\n');
    console.log('=== GO/NO-GO: NO-GO — No correlation pairs to backtest ===');
    process.exit(1);
  }
  const results = opportunities.map(backtestPair);

  // Print results table
  console.log('| Pair | Cluster | Corr | Conf | Trades | Wins | Hit Rate | Total P&L | Avg P&L | Max DD |');
  console.log('|------|---------|------|------|--------|------|----------|-----------|---------|--------|');
  for (const r of results) {
    console.log(`| ${r.pair} | ${r.cluster} | ${r.correlation.toFixed(3)} | ${r.confidence.toFixed(2)} | ${r.tradeCount} | ${r.wins} | ${(r.hitRate * 100).toFixed(0)}% | ${r.totalPnl.toFixed(4)} | ${r.avgPnl.toFixed(4)} | ${r.maxDrawdown.toFixed(4)} |`);
  }

  // Summary statistics
  const totalTrades = results.reduce((s, r) => s + r.tradeCount, 0);
  const totalWins = results.reduce((s, r) => s + r.wins, 0);
  const overallHitRate = totalTrades > 0 ? totalWins / totalTrades : 0;
  const overallPnl = results.reduce((s, r) => s + r.totalPnl, 0);
  const worstDrawdown = Math.min(...results.map(r => r.maxDrawdown));

  console.log('\n--- Backtest Summary ---');
  console.log(`Total pairs backtested: ${results.length}`);
  console.log(`Total trades: ${totalTrades}`);
  console.log(`Overall hit rate: ${(overallHitRate * 100).toFixed(1)}%`);
  console.log(`Total P&L (spread units): ${overallPnl.toFixed(4)}`);
  console.log(`Worst single-trade drawdown: ${worstDrawdown.toFixed(4)}`);

  // Go/No-Go recommendation
  const goNoGo = overallHitRate >= 0.5 && overallPnl > 0 && failed === 0;
  console.log(`\n=== GO/NO-GO: ${goNoGo ? 'GO — Pipeline validated, backtest positive' : 'NO-GO — See issues above'} ===`);

  // === WRITE REPORT ===
  const report = `# T530 — Backtest Report & Pipeline Validation

**Generated:** ${new Date().toISOString()}
**Script:** \`node agents/grace/output/backtest_correlation_pairs.js\`

## Pipeline Data Quality Validation

### Phase 1: Market Filtering (Grace)
${p1Checks.map(c => `- ${c.pass ? '✅' : '❌'} ${c.check} — ${c.detail}`).join('\n')}

### Phase 2: LLM Clustering (Ivan)
${p2Checks.map(c => `- ${c.pass ? '✅' : '❌'} ${c.check} — ${c.detail}`).join('\n')}

### Phase 3: Correlation Pairs (Bob)
${p3Checks.map(c => `- ${c.pass ? '✅' : '❌'} ${c.check} — ${c.detail}`).join('\n')}

**Result: ${passed}/${allChecks.length} checks passed, ${failed} failed**

## Backtest Results (30-day Simulated History)

| Pair | Cluster | Correlation | Confidence | Trades | Wins | Hit Rate | Total P&L | Avg P&L | Max DD |
|------|---------|-------------|------------|--------|------|----------|-----------|---------|--------|
${results.map(r => `| ${r.pair} | ${r.cluster} | ${r.correlation.toFixed(3)} | ${r.confidence.toFixed(2)} | ${r.tradeCount} | ${r.wins} | ${(r.hitRate * 100).toFixed(0)}% | ${r.totalPnl.toFixed(4)} | ${r.avgPnl.toFixed(4)} | ${r.maxDrawdown.toFixed(4)} |`).join('\n')}

### Summary

- **Pairs backtested:** ${results.length}
- **Total trades:** ${totalTrades}
- **Overall hit rate:** ${(overallHitRate * 100).toFixed(1)}%
- **Total P&L (spread units):** ${overallPnl.toFixed(4)}
- **Worst drawdown:** ${worstDrawdown.toFixed(4)}

## Caveats

1. Backtest uses **simulated** mean-reverting spread data (no real Kalshi historical API yet — blocked by T236)
2. Spread units are abstract — real $ P&L depends on contract sizes (unconfirmed per consensus decision #1)
3. Slippage, fees, and execution latency not modeled
4. 30-day lookback with deterministic RNG for reproducibility

## Go/No-Go Recommendation

**${goNoGo ? 'GO' : 'NO-GO'}** — ${goNoGo
  ? 'Pipeline data quality validated across all 3 phases. Backtest shows positive expected value with hit rate above 50%. Ready for Phase 4 execution pending Kalshi API credentials (T236).'
  : 'Issues found — see validation failures above. Do not proceed to Phase 4 until resolved.'}

### Remaining Blockers for Live Trading
1. **T236** — Kalshi API credentials (Founder)
2. **Contract sizes** — Need confirmation for position sizing
3. **Real historical data** — Current backtest uses simulated spreads
`;

  const reportPath = path.join(OUTPUT, 'backtest_report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport written to: ${reportPath}`);

  // Also write structured results JSON
  const resultsJSON = {
    generated_at: new Date().toISOString(),
    task: 'T530',
    pipeline_validation: {
      total_checks: allChecks.length,
      passed,
      failed,
      phases: {
        phase1: p1Checks.map(c => ({ check: c.check, pass: c.pass })),
        phase2: p2Checks.map(c => ({ check: c.check, pass: c.pass })),
        phase3: p3Checks.map(c => ({ check: c.check, pass: c.pass }))
      }
    },
    backtest: {
      pairs_tested: results.length,
      total_trades: totalTrades,
      overall_hit_rate: overallHitRate,
      total_pnl: overallPnl,
      worst_drawdown: worstDrawdown,
      per_pair: results.map(r => ({
        pair: r.pair, cluster: r.cluster,
        correlation: r.correlation, confidence: r.confidence,
        trades: r.tradeCount, wins: r.wins, hit_rate: r.hitRate,
        total_pnl: r.totalPnl, avg_pnl: r.avgPnl, max_drawdown: r.maxDrawdown
      }))
    },
    recommendation: goNoGo ? 'GO' : 'NO-GO'
  };

  const resultsPath = path.join(OUTPUT, 'backtest_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(resultsJSON, null, 2));
  console.log(`Results JSON written to: ${resultsPath}`);
}

main();
