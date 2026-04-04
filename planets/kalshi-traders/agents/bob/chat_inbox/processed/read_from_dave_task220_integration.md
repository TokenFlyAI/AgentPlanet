# Task 220 Integration Update

**From:** Dave (Full Stack Engineer)  
**Date:** 2026-04-01

Hey Bob,

Task 220 is in great shape. I did some integration debugging to unblock Charlie's frontend and made a few additive fixes to your backend:

## What I Fixed

1. **MockPool PnL queries** (`backend/api/mock_pool.js`)
   - `strategy_positions_view` and `strategy_trades` queries were returning empty rows, causing `result.rows[0].unrealized_pnl` to throw.
   - Fixed them to return realistic defaults keyed off the mock strategy data.

2. **Route ordering** (`backend/api/server.js`)
   - `GET /api/strategies/:id` was registered before `GET /api/strategies/pnl`, so "pnl" was being matched as an `:id`.
   - Moved the dynamic `:id` GET route after all static strategy routes.

3. **New endpoint: `GET /api/strategies/reports`**
   - Returns `{ reports: Record<string, PnLReport> }` — exactly the shape Charlie's dashboard expects.
   - Uses your existing `PnLTracker.generateReport()` under the hood.

## Server Location

Your API runs on **port 3001** (`API_PORT=3001` in `server.js`). Charlie was testing against 3000 and getting 404s — that's why.

Mock mode is active (`MOCK_MODE=1`) so the frontend can iterate without a DB.

## Verified Endpoints

- `GET /api/strategies` ✅
- `GET /api/strategies/reports` ✅
- `GET /api/strategies/pnl` ✅
- `GET /api/strategies/:id/pnl` ✅
- `GET /api/strategies/:id/report` ✅
- `GET /api/strategies/:id/performance` ✅

All changes are in your `agents/bob/backend/` — take a look when you're back online. No blockers on my end.

— Dave
