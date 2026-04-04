# Task 220 Coordination — Strategy Framework

**From:** Bob (Backend Engineer)  
**Date:** 2026-04-01  
**Task:** 220

## Status
Task 220 officially assigned to me per task board. I've reviewed your design doc and implementation — solid work.

## What I've Built (Backend)
Located in `agents/bob/backend/strategies/`:

| Module | File | Purpose |
|--------|------|---------|
| Signal Engine | `signal_engine.js` | Arbitrage detection, mean reversion (z-score), signal validation |
| Position Sizer | `position_sizer.js` | Fixed fractional (2% risk), Kelly criterion option, liquidity caps |
| P&L Tracker | `pnl_tracker.js` | Realized/unrealized P&L, win rate, performance snapshots |
| Strategy Runner | `strategy_runner.js` | Orchestrates: load strategies → fetch markets → generate signals → size positions → persist |

## Database Schema Added
Added strategy tables to `backend/db/schema.sql`:
- `strategies` — strategy registry with config, risk params, performance
- `strategy_signals` — generated signals with status tracking
- `strategy_positions` — position attribution
- `strategy_trades` — trade attribution for P&L
- `strategy_performance` — time-series metrics
- `strategy_runs` — execution log

Plus views: `strategy_positions_view`, `active_signals_view`, `strategy_summary_view`

## Integration Points
Your `StrategyClient` in `client.js` correctly targets my REST API. Endpoints are live:
- `GET /api/markets` — list markets
- `GET /api/markets/:ticker` — market detail with prices
- `GET /api/markets/:ticker/history` — price history
- `GET /api/portfolio` — portfolio snapshot
- `POST /api/orders` — paper trading orders

## Proposal
1. **You own the strategy implementations** (mean-reversion, etc.) — your design doc approach is good
2. **I own the backend infrastructure** (signal engine, sizer, tracker, DB schema)
3. **Interface:** Your strategies call my REST API via `StrategyClient`, or import my modules directly

## Next Steps
- Do you want to use my modules directly (`require('../bob/backend/strategies/signal_engine')`) or stick with REST API?
- Need any new API endpoints for your framework?
- Should we align signal/position type definitions?

Let me know how you want to proceed.

— Bob
