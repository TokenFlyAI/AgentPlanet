#!/usr/bin/env node
/**
 * T528 — LongshotFadingStrategy BUG-001 Fix Validation
 *
 * Verifies: minEdge lowered from 2 to 0.5 so signals generate correctly.
 * Also validates Phase 1 market_filter.js output.
 *
 * Run: node agents/bob/output/t528_longshot_fix_validation.js
 */

"use strict";

const path = require("path");
const fs = require("fs");

// --- Part 1: LongshotFading signal generation ---
const { LongshotFadingStrategy } = require(
  path.join(__dirname, "backend/strategies/strategies/longshot_fading.js")
);

const strat = new LongshotFadingStrategy();
console.log("=== T528 Validation: LongshotFading BUG-001 Fix ===\n");
console.log("minEdge (should be 0.5):", strat.minEdge);

const testMarkets = [
  { id: "t1", category: "Weather", yes_mid: 5 },
  { id: "t2", category: "Weather", yes_mid: 8 },
  { id: "t3", category: "Entertainment", yes_mid: 10 },
  { id: "t4", category: "Entertainment", yes_mid: 12 },
  { id: "t5", category: "Culture", yes_mid: 15 },
  { id: "t6", category: "Geopolitics", yes_mid: 18 },
  { id: "t7", category: "Geopolitics", yes_mid: 20 },
  { id: "t8", category: "Economics", yes_mid: 10 },  // wrong category — should be filtered
];

const signals = strat.generateSignals(testMarkets);
console.log(`Signals generated: ${signals.length} (expected: >0, was 0 before fix)\n`);

let pass = true;

if (strat.minEdge !== 0.5) {
  console.log("FAIL: minEdge should be 0.5, got", strat.minEdge);
  pass = false;
}

if (signals.length === 0) {
  console.log("FAIL: No signals generated — BUG-001 still present");
  pass = false;
}

// Verify no Economics category signals leaked through
const econSignals = signals.filter(s => s.metadata.category === "Economics");
if (econSignals.length > 0) {
  console.log("FAIL: Economics category should be filtered out");
  pass = false;
}

for (const s of signals) {
  console.log(`  Market ${s.marketId}: edge=${s.expectedEdge}¢, confidence=${s.confidence.toFixed(2)}, category=${s.metadata.category}`);
}

// Edge math verification at key prices
console.log("\n--- Edge Math Verification ---");
for (const price of [5, 8, 10, 12, 15, 18, 20]) {
  const factor = (20 - price) / (20 - 5);
  const edge = Math.min(price * 0.15 * factor, 10);
  const passEdge = edge >= 0.5;
  console.log(`  Price=${price}¢: edge=${edge.toFixed(3)}¢ ${passEdge ? "✓ passes" : "✗ below"} minEdge(0.5)`);
}

// --- Part 2: Validate market_filter.js output ---
console.log("\n=== Phase 1: market_filter.js Output Validation ===\n");

// market_filter.js writes to public/markets_filtered.json
// __dirname resolves to output/bob/, 2 levels up = planet root
const projectRoot = path.resolve(__dirname, "../..");
const filterOutputPath = path.join(projectRoot, "public/markets_filtered.json");
const filterOutputPathAlt = path.join(projectRoot, "shared/markets_filtered.json");
let filterPass = true;

const actualFilterPath = fs.existsSync(filterOutputPath) ? filterOutputPath : filterOutputPathAlt;
if (fs.existsSync(actualFilterPath)) {
  const data = JSON.parse(fs.readFileSync(actualFilterPath, "utf8"));
  console.log("markets_filtered.json exists: ✓");
  console.log(`  Generated at: ${data.generated_at}`);
  console.log(`  Total markets: ${data.summary.total_markets}`);
  console.log(`  Qualifying: ${data.summary.qualifying_markets}`);

  if (!data.qualifying_markets || data.qualifying_markets.length === 0) {
    console.log("WARN: No qualifying markets — filter may be too strict");
  }

  for (const m of data.qualifying_markets) {
    const hasRequiredFields = m.id && m.ticker && m.yes_ratio != null;
    console.log(`  ${m.ticker}: ratio=${m.yes_ratio}% ${hasRequiredFields ? "✓" : "✗ missing fields"}`);
    if (!hasRequiredFields) filterPass = false;
  }
} else {
  console.log("FAIL: markets_filtered.json not found at", filterOutputPath);
  filterPass = false;
}

// --- Summary ---
console.log("\n=== RESULTS ===");
console.log(`LongshotFading BUG-001 fix: ${pass ? "✅ PASS" : "❌ FAIL"}`);
console.log(`Phase 1 market filter output: ${filterPass ? "✅ PASS" : "❌ FAIL"}`);

process.exit(pass && filterPass ? 0 : 1);
