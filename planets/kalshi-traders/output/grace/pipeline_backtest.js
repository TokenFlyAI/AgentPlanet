#!/usr/bin/env node
/**
 * T530 Step 2: End-to-End Pipeline Backtest & Data Chain Validation
 *
 * Validates:
 * 1. Every ticker in correlation_pairs.json traces back to markets_filtered.json
 * 2. Backtest correlation pairs for real arbitrage opportunity vs noise
 * 3. Report data chain integrity
 *
 * Author: Grace (Data Engineer)
 * Date: 2026-04-04
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PUBLIC = path.join(__dirname, "../../public");

function loadJSON(file) {
  const full = path.join(PUBLIC, file);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function validateDataChain() {
  console.log("=== T530 End-to-End Pipeline Backtest ===\n");

  // Load Phase 1 output
  const filtered = loadJSON("markets_filtered.json");
  if (!filtered) {
    console.error("FAIL: markets_filtered.json not found");
    return { pass: false, error: "missing markets_filtered.json" };
  }

  const qualifyingTickers = new Set(filtered.qualifying_markets.map(m => m.ticker));
  console.log(`Phase 1: ${qualifyingTickers.size} qualifying markets`);
  for (const t of qualifyingTickers) console.log(`  - ${t}`);

  // Load Phase 2 output (clusters)
  const clusters = loadJSON("market_clusters.json");
  if (clusters) {
    const clusterTickers = new Set();
    const clusterData = clusters.clusters || clusters.market_clusters || [];
    for (const c of clusterData) {
      for (const m of (c.markets || c.tickers || [])) {
        clusterTickers.add(typeof m === "string" ? m : m.ticker);
      }
    }
    console.log(`\nPhase 2: ${clusterTickers.size} clustered tickers`);

    // Validate: all cluster tickers must be in Phase 1
    const orphanClusters = [...clusterTickers].filter(t => !qualifyingTickers.has(t));
    if (orphanClusters.length > 0) {
      console.log(`  WARNING: ${orphanClusters.length} cluster tickers NOT in Phase 1:`);
      for (const t of orphanClusters) console.log(`    - ${t} (ORPHAN)`);
    } else {
      console.log("  OK: All cluster tickers trace to Phase 1");
    }
  } else {
    console.log("\nPhase 2: market_clusters.json not found (skipping)");
  }

  // Load Phase 3 output (correlation pairs)
  const corr = loadJSON("correlation_pairs.json");
  if (!corr) {
    console.log("\nPhase 3: correlation_pairs.json not found (skipping)");
    return { pass: true, note: "Phase 1 validated, Phase 3 not yet available" };
  }

  const pairs = corr.all_pairs || corr.pairs || corr.correlation_pairs || [];
  console.log(`\nPhase 3: ${pairs.length} correlation pairs`);

  // Validate: all pair tickers must trace to Phase 1
  const issues = [];
  const backtestResults = [];

  for (const pair of pairs) {
    const t1 = pair.market1 || pair.ticker_a;
    const t2 = pair.market2 || pair.ticker_b;
    const inPhase1_1 = qualifyingTickers.has(t1);
    const inPhase1_2 = qualifyingTickers.has(t2);

    if (!inPhase1_1) issues.push(`${t1} in pair but NOT in Phase 1`);
    if (!inPhase1_2) issues.push(`${t2} in pair but NOT in Phase 1`);

    // Backtest: evaluate arbitrage quality
    const r = Math.abs(pair.pearson_r || 0);
    const sig = pair.statistically_significant;
    const z = Math.abs(pair.spread_zscore || 0);
    const arb = pair.arbitrage || {};
    const edge = arb.estimated_edge_cents || 0;
    const confidence = pair.confidence || 0;

    let quality = "NOISE";
    let reason = [];

    if (r >= 0.5 && sig && z >= 1.5 && edge >= 3) {
      quality = "STRONG_SIGNAL";
      reason.push(`high correlation (${r.toFixed(2)}), significant, z=${z.toFixed(2)}, edge=${edge.toFixed(1)}c`);
    } else if (r >= 0.3 && sig && z >= 1.5) {
      quality = "MODERATE_SIGNAL";
      reason.push(`moderate correlation (${r.toFixed(2)}), significant, z=${z.toFixed(2)}`);
    } else if (sig && z >= 1.5) {
      quality = "WEAK_SIGNAL";
      reason.push(`low correlation (${r.toFixed(2)}) but significant spread deviation`);
    } else {
      reason.push(`r=${r.toFixed(2)}, sig=${sig}, z=${z.toFixed(2)} — insufficient`);
    }

    backtestResults.push({
      pair: `${t1} <-> ${t2}`,
      pearson_r: r,
      significant: sig,
      spread_z: z,
      edge_cents: edge,
      confidence,
      quality,
      reason: reason.join("; "),
      chain_valid: inPhase1_1 && inPhase1_2,
    });
  }

  // Print results
  console.log("\n=== DATA CHAIN VALIDATION ===");
  if (issues.length === 0) {
    console.log("PASS: All correlation pair tickers trace to Phase 1 markets_filtered.json");
  } else {
    console.log(`FAIL: ${issues.length} data chain breaks:`);
    for (const i of issues) console.log(`  - ${i}`);
  }

  console.log("\n=== BACKTEST RESULTS ===");
  console.log("| Pair | |r| | Sig | |z| | Edge | Quality |");
  console.log("|------|-----|-----|-----|------|---------|");
  for (const b of backtestResults) {
    console.log(`| ${b.pair} | ${b.pearson_r.toFixed(2)} | ${b.significant ? "Y" : "N"} | ${b.spread_z.toFixed(2)} | ${b.edge_cents.toFixed(1)}c | ${b.quality} |`);
  }

  const strong = backtestResults.filter(b => b.quality === "STRONG_SIGNAL").length;
  const moderate = backtestResults.filter(b => b.quality === "MODERATE_SIGNAL").length;
  const weak = backtestResults.filter(b => b.quality === "WEAK_SIGNAL").length;
  const noise = backtestResults.filter(b => b.quality === "NOISE").length;

  console.log(`\nSignal Summary: ${strong} strong, ${moderate} moderate, ${weak} weak, ${noise} noise`);
  console.log(`Data Chain: ${issues.length === 0 ? "INTACT" : "BROKEN"}`);

  // Write report
  const report = {
    generated_at: new Date().toISOString(),
    task: "T530/T537",
    phase: "End-to-End Pipeline Backtest",
    data_chain: {
      phase1_markets: qualifyingTickers.size,
      phase3_pairs: pairs.length,
      chain_breaks: issues,
      chain_intact: issues.length === 0,
    },
    backtest: backtestResults,
    summary: {
      strong_signals: strong,
      moderate_signals: moderate,
      weak_signals: weak,
      noise: noise,
      recommendation: strong > 0
        ? "Pipeline produces actionable signals — proceed to paper trading"
        : moderate > 0
          ? "Moderate signals found — expand market universe for stronger pairs"
          : "No strong signals — pipeline needs more diverse markets or real API data",
    },
  };

  const outPath = path.join(__dirname, "pipeline_backtest_report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport written to: ${outPath}`);

  return report;
}

if (require.main === module) {
  try {
    const result = validateDataChain();
    const ok = result.data_chain ? result.data_chain.chain_intact : result.pass;
    console.log(`\n${ok ? "✅" : "❌"} Pipeline backtest ${ok ? "PASSED" : "FAILED"}`);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error("Pipeline backtest error:", e);
    process.exit(1);
  }
}

module.exports = { validateDataChain };
