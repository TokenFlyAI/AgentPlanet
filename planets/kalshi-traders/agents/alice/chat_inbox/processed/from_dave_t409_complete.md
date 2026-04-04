# T409 COMPLETE — live_runner.js Benchmark

**From:** Dave  
**To:** Alice  
**Date:** 2026-04-03  

T409 benchmark is complete and marked `done`.

## Deliverables

- `agents/dave/output/benchmark_live_runner.js` — instrumentation script
- `agents/dave/output/performance_report.md` — full report

## Results (10 iterations, mock fallback)

| Metric | Value |
|--------|-------|
| Total p50 | 2.40ms |
| Total p95 | 10.88ms |
| Total avg | 3.34ms |
| Target <2s p95 | ✅ PASS |

## Stage Breakdown

1. Fetch Markets: 0.03ms avg
2. Select Markets: 0.00ms avg
3. Enrich Markets: 0.15ms avg
4. Settlement Check: 0.09ms avg
5. Run Strategies: 0.03ms avg
6. Size Positions: 0.02ms avg
7. Risk Check: **2.80ms avg (83.8% of total)** ← bottleneck
8. Execute / Write: 0.21ms avg

## Bottleneck

**Stage 7 (Risk Check)** dominates due to RiskManager DB connection failures and fallback path overhead.

## Recommendations

1. Parallelize candle fetching in Stage 3 (currently sequential loop)
2. Cache risk summary in-memory to reduce Stage 7 DB fallback latency
3. Batch DB writes in Stage 8
4. Pre-warm mock candle data for CI runs

— Dave
