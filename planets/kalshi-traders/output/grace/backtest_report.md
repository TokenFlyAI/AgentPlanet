# T530 — Backtest Report & Pipeline Validation

**Generated:** 2026-04-04T04:13:01.535Z
**Script:** `node agents/grace/output/backtest_correlation_pairs.js`

## Pipeline Data Quality Validation

### Phase 1: Market Filtering (Grace)
- ✅ File exists & parses — Generated at 2026-04-03T23:31:28.938Z
- ✅ Has qualifying_markets array — 3 markets
- ✅ At least 1 qualifying market — 3 found
- ✅ All markets have required fields — id, ticker, category, volume, yes_ratio
- ✅ All markets volume >= 10,000 — BTCW-26-JUN30-80K: 720000, ETHW-26-DEC31-5K: 540000, KXNF-20260501-T200000: 180000
- ✅ No markets in excluded 40-60% range — BTCW-26-JUN30-80K: 84%, ETHW-26-DEC31-5K: 30%, KXNF-20260501-T200000: 27%

### Phase 2: LLM Clustering (Ivan)
- ✅ File exists & parses — Generated at 2026-04-03T21:10:39.115307
- ✅ Has clusters array — 1 clusters
- ✅ All clusters have id, label, markets — crypto_cluster
- ✅ Clustered markets exist in filtered set — 2 clustered, 3 filtered

### Phase 3: Correlation Pairs (Bob)
- ✅ File exists & parses — Generated at 2026-04-03T21:12:00.434561
- ✅ Has pairs data — 3 pairs (format B)
- ✅ All pairs have required fields — market_a, market_b, pearson_correlation, arbitrage_confidence
- ✅ Correlation values in [-1, 1] — 0.380, 0.171, -0.000
- ✅ Confidence values in [0, 1] — All valid
- ✅ At least 1 arbitrage opportunity — 2 opportunities found

**Result: 16/16 checks passed, 0 failed**

## Backtest Results (30-day Simulated History)

| Pair | Cluster | Correlation | Confidence | Trades | Wins | Hit Rate | Total P&L | Avg P&L | Max DD |
|------|---------|-------------|------------|--------|------|----------|-----------|---------|--------|
| KXNF-20260501-T200000 / ETHW-26-DEC31-5K | cross_domain | 0.380 | 0.68 | 0 | 0 | 0% | 0.0000 | 0.0000 | 0.0000 |
| KXNF-20260501-T200000 / BTCW-26-JUN30-80K | cross_domain | 0.171 | 0.37 | 5 | 3 | 60% | 39.2519 | 7.8504 | -36.7614 |

### Summary

- **Pairs backtested:** 2
- **Total trades:** 5
- **Overall hit rate:** 60.0%
- **Total P&L (spread units):** 39.2519
- **Worst drawdown:** -36.7614

## Caveats

1. Backtest uses **simulated** mean-reverting spread data (no real Kalshi historical API yet — blocked by T236)
2. Spread units are abstract — real $ P&L depends on contract sizes (unconfirmed per consensus decision #1)
3. Slippage, fees, and execution latency not modeled
4. 30-day lookback with deterministic RNG for reproducibility

## Go/No-Go Recommendation

**GO** — Pipeline data quality validated across all 3 phases. Backtest shows positive expected value with hit rate above 50%. Ready for Phase 4 execution pending Kalshi API credentials (T236).

### Remaining Blockers for Live Trading
1. **T236** — Kalshi API credentials (Founder)
2. **Contract sizes** — Need confirmation for position sizing
3. **Real historical data** — Current backtest uses simulated spreads
