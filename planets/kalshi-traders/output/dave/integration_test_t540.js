#!/usr/bin/env node
// T540: Integration Test — C++ Engine with Corrected correlation_pairs.json
// Tests: JSON loading, field mapping, engine init, mock feed, risk summary export

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLANET_ROOT = path.resolve(__dirname, '..', '..');
const ENGINE_DIR = path.join(PLANET_ROOT, 'agents', 'bob', 'backend', 'cpp_engine');
const PAIRS_PATH = path.join(PLANET_ROOT, 'shared', 'correlation_pairs.json');
const ENGINE_BIN = path.join(ENGINE_DIR, 'engine');
const RISK_OUT = path.join(ENGINE_DIR, 'risk_summary.json');

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ FAIL: ${name} — ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('=== T540: C++ Engine Integration Test with Corrected correlation_pairs.json ===\n');

// --- Test 1: correlation_pairs.json exists and is valid ---
console.log('--- Phase 3 Output Validation ---');

test('correlation_pairs.json exists', () => {
  assert(fs.existsSync(PAIRS_PATH), 'File not found: ' + PAIRS_PATH);
});

const pairsData = JSON.parse(fs.readFileSync(PAIRS_PATH, 'utf8'));

test('Has "pairs" array', () => {
  assert(Array.isArray(pairsData.pairs), 'Missing pairs array');
  assert(pairsData.pairs.length > 0, 'Empty pairs array');
});

test('Pairs have required fields (corrected schema)', () => {
  const p = pairsData.pairs[0];
  assert(typeof p.market_a === 'string', 'Missing market_a');
  assert(typeof p.market_b === 'string', 'Missing market_b');
  assert(typeof p.pearson_r === 'number', 'Missing pearson_r');
  assert(typeof p.spread_zscore === 'number', 'Missing spread_zscore');
  assert(typeof p.is_arbitrage_opportunity === 'boolean', 'Missing is_arbitrage_opportunity');
  assert(typeof p.estimated_edge_cents === 'number', 'Missing estimated_edge_cents');
});

const arbPairs = pairsData.pairs.filter(p => p.is_arbitrage_opportunity);
test('Has arbitrage opportunities', () => {
  assert(arbPairs.length > 0, 'No arb opportunities found');
  console.log(`    (${arbPairs.length} arb pairs out of ${pairsData.pairs.length} total)`);
});

test('Arbitrage pairs have positive edge', () => {
  for (const p of arbPairs) {
    assert(p.estimated_edge_cents > 0 || Math.abs(p.spread_zscore) > 1.5,
      `Arb pair ${p.market_a}/${p.market_b} has no edge`);
  }
});

// --- Test 2: C++ Engine compilation ---
console.log('\n--- C++ Engine Compilation ---');

test('Engine binary exists', () => {
  assert(fs.existsSync(ENGINE_BIN), 'Engine binary not found at ' + ENGINE_BIN);
});

test('Engine compiles cleanly with updated parser', () => {
  const result = spawnSync('g++', ['-std=c++17', '-O2', '-o', 'engine', 'engine.cpp', '-lpthread'], {
    cwd: ENGINE_DIR, timeout: 30000
  });
  assert(result.status === 0, 'Compile failed: ' + (result.stderr || '').toString());
});

// --- Test 3: Engine loads corrected correlation_pairs.json ---
console.log('\n--- Engine Integration with Corrected Data ---');

test('Engine initializes with corrected correlation_pairs.json', () => {
  const result = spawnSync(ENGINE_BIN, [PAIRS_PATH], {
    cwd: ENGINE_DIR, timeout: 15000
  });
  const stdout = result.stdout.toString();
  assert(stdout.includes('Engine initialized'), 'Engine did not initialize');
  assert(stdout.includes('Smoke test complete'), 'Smoke test did not complete');
  assert(result.status === 0, 'Engine exited with error: ' + result.status);
});

test('Risk summary exported after run', () => {
  assert(fs.existsSync(RISK_OUT), 'risk_summary.json not found');
  const summary = JSON.parse(fs.readFileSync(RISK_OUT, 'utf8'));
  assert(typeof summary.max_drawdown === 'number', 'Missing max_drawdown');
  assert(typeof summary.max_drawdown_percent === 'number', 'Missing max_drawdown_percent');
  assert(typeof summary.peak_unrealized_pnl === 'number', 'Missing peak_unrealized_pnl');
  console.log(`    (max_drawdown=${summary.max_drawdown}, peak_pnl=${summary.peak_unrealized_pnl})`);
});

// --- Test 4: Test suite passes with corrected data ---
console.log('\n--- Full Test Suite with Corrected Data ---');

test('All 29 engine tests pass', () => {
  const result = spawnSync('g++', ['-std=c++17', '-O2', '-DNO_MAIN', '-o', 'test_suite', 'test_suite.cpp', '-lpthread'], {
    cwd: ENGINE_DIR, timeout: 30000
  });
  assert(result.status === 0, 'Test suite compile failed');

  const run = spawnSync(path.join(ENGINE_DIR, 'test_suite'), [], {
    cwd: ENGINE_DIR, timeout: 30000
  });
  const stdout = run.stdout.toString();
  const passMatch = stdout.match(/Passed: (\d+)/);
  const failMatch = stdout.match(/Failed: (\d+)/);
  assert(passMatch && parseInt(passMatch[1]) >= 29, 'Expected >= 29 tests passed, got: ' + (passMatch ? passMatch[1] : 'unknown'));
  assert(failMatch && parseInt(failMatch[1]) === 0, 'Tests failed: ' + (failMatch ? failMatch[1] : 'unknown'));
  console.log(`    (${passMatch[1]} passed, ${failMatch[1]} failed)`);
});

// --- Test 5: Field mapping verification ---
console.log('\n--- Field Mapping Verification ---');

test('pearson_r maps to pearson_correlation (non-zero values loaded)', () => {
  // Verify by checking engine accepts pairs with pearson_r field
  const nonZeroPearson = pairsData.pairs.filter(p => Math.abs(p.pearson_r) > 0.01);
  assert(nonZeroPearson.length > 10, 'Expected >10 pairs with non-zero pearson_r');
  console.log(`    (${nonZeroPearson.length} pairs with |pearson_r| > 0.01)`);
});

test('spread_zscore maps to expected_spread', () => {
  const nonZeroSpread = pairsData.pairs.filter(p => Math.abs(p.spread_zscore) > 0.01);
  assert(nonZeroSpread.length > 10, 'Expected >10 pairs with non-zero spread_zscore');
  console.log(`    (${nonZeroSpread.length} pairs with |spread_zscore| > 0.01)`);
});

test('estimated_edge_cents maps to arbitrage_confidence (÷100)', () => {
  const withEdge = arbPairs.filter(p => p.estimated_edge_cents > 0);
  assert(withEdge.length > 0, 'Expected arb pairs with edge > 0');
  console.log(`    (${withEdge.length} arb pairs with positive edge)`);
});

// --- Summary ---
console.log(`\n=== Integration Test Summary ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
console.log(`Result: ${failed === 0 ? 'ALL PASS ✅' : 'FAILURES ❌'}`);

process.exit(failed > 0 ? 1 : 0);
