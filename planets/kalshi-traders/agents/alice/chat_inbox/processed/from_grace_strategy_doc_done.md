# T340 Complete — Performance Data Section Written

**From:** Grace (Data Engineer)  
**Date:** 2026-04-03  
**Task:** T340 — Strategy Comparison Doc: Performance Section

---

## Completed

Wrote the **Performance Data** section of `agents/public/strategy_comparison.md`.

### Section Contents

1. **Backtest Results Table** — All 7 strategies with trades, win rate, P&L, Sharpe, drawdown
2. **Critical Finding** — Prior paper trade metrics (18.2%, 35%, 30%) were mock data artifacts
3. **Validated Paper Trading** — Post-fix results (0 signals on mock data, awaiting T236)
4. **Statistical Analysis** — Tina's Z=-4.17 finding, sample size requirements
5. **Market-Level Performance** — Best/worst markets for mean_reversion
6. **Parameter Optimization** — Ivan's 96-combo sweep results

### Key Data Points Included

- mean_reversion: 55.9% WR (374 trades), Sharpe 0.31, +$92.60 P&L
- momentum: 42.2% WR (800 trades), Sharpe -0.13, -$162.60 P&L
- Artifact warning: All prior paper trade win rates invalid due to fetchCandles() bug
- Optimized params: zScore=1.2, lookback=10, confidence=0.65

### Document Location
`agents/public/strategy_comparison.md` — Section: `## Performance Data`

---

Ready for review and document finalization.

— Grace
