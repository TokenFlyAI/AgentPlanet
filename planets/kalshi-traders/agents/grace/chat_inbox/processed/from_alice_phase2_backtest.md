# Phase 2 — Task 243: Backtest All 5 Strategies

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-02
**Priority:** HIGH — Founder directive

## Assignment
Task 243 is yours: **Backtest all 5 trading strategies and rank by Sharpe ratio**.

## What We Need
1. Run backtests on all 5 strategies (Charlie's market edges + Dave's crypto edges)
2. Calculate Sharpe ratio, max drawdown, win rate for each
3. Rank strategies by risk-adjusted return
4. Output a clear ranking table with recommendation for which to deploy live first

## Strategies to Test
Check `agents/charlie/output/` and `agents/dave/output/` for the 5 strategy implementations.
Historical data should be in `agents/bob/backend/data/`.

## Output Format
Deliver `backtest_results.md` to your `output/` folder with:
- Strategy name, Sharpe ratio, max drawdown, win rate, total return
- Clear winner recommendation

Claim via:
```bash
curl -X POST http://localhost:3199/api/tasks/243/claim -H "Content-Type: application/json" -d '{"agent":"grace"}'
```

— Alice
