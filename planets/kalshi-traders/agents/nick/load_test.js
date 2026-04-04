#!/usr/bin/env node
// Load Test Script — Task #48: Rate Limiter Verification
// Nick (Performance Engineer)

const http = require('http');

const BASE = 'http://localhost:3199';

function request(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3199,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

// Send N requests as fast as possible, return counts of each status code
async function burst(method, path, n, body) {
  const promises = [];
  for (let i = 0; i < n; i++) {
    promises.push(request(method, path, body));
  }
  const results = await Promise.all(promises);
  const counts = {};
  for (const r of results) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }
  return { counts, results };
}

// Send N requests spread across 1 minute at a given req/min rate
// For rate verification we just send them all at once (burst), then wait for window to reset
async function runTest(label, method, path, reqPerMin, body) {
  console.log(`\n=== ${label} ===`);
  console.log(`  ${method} ${path} @ ~${reqPerMin} req/min (burst of ${reqPerMin})`);
  const start = Date.now();
  const { counts } = await burst(method, path, reqPerMin, body);
  const duration = Date.now() - start;
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Status counts:`, counts);
  return { label, method, path, reqPerMin, counts, durationMs: duration };
}

async function resetWindow() {
  // Wait 61 seconds to reset the sliding window
  console.log('\n  [waiting 61s for rate window reset...]');
  await new Promise((r) => setTimeout(r, 61000));
}

async function main() {
  console.log('=== Nick Load Test — Rate Limiter Verification ===');
  console.log('Server: http://localhost:3199');
  console.log('Date:', new Date().toISOString());

  const taskBody = { title: 'LoadTestTask', priority: 'low', description: 'load test' };

  // Test 1: 50 req/min at POST /api/tasks (strict write limiter = 20 req/min)
  const t1 = await runTest(
    'Test 1: POST /api/tasks @ 50 req/min',
    'POST', '/api/tasks', 50, taskBody
  );

  await resetWindow();

  // Test 2: 200 req/min at POST /api/tasks
  const t2 = await runTest(
    'Test 2: POST /api/tasks @ 200 req/min',
    'POST', '/api/tasks', 200, taskBody
  );

  await resetWindow();

  // Test 3: GET /api/agents at 120 req/min (general limiter)
  const t3 = await runTest(
    'Test 3: GET /api/agents @ 120 req/min',
    'GET', '/api/agents', 120, null
  );

  await resetWindow();

  // Test 4: GET /api/agents at 130 req/min (should hit 120 req/min general limit)
  const t4 = await runTest(
    'Test 4: GET /api/agents @ 130 req/min (expect 429s after 120)',
    'GET', '/api/agents', 130, null
  );

  // Summary
  console.log('\n=== SUMMARY ===');
  for (const t of [t1, t2, t3, t4]) {
    const ok = (t.counts[200] || 0) + (t.counts[201] || 0);
    const ratelimited = t.counts[429] || 0;
    const other = Object.entries(t.counts)
      .filter(([k]) => !['200', '201', '429'].includes(k))
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    console.log(`${t.label}`);
    console.log(`  OK: ${ok}, 429: ${ratelimited}${other ? ', other: ' + other : ''}`);
    console.log(`  Duration: ${t.durationMs}ms`);
  }

  return { t1, t2, t3, t4 };
}

main().then((results) => {
  process.env.LOAD_TEST_RESULTS = JSON.stringify(results);
  // Write results to stdout in a machine-readable way
  console.log('\n__RESULTS__');
  console.log(JSON.stringify(results, null, 2));
}).catch(console.error);
