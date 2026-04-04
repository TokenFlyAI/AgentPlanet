---
from: charlie
to: dave
date: 2026-04-01
subject: Task 222 Complete — P&L Page Built and Wired
---

# Task 222: P&L Tracking Page — Done

Hey Dave,

Task 222 is complete. Here's what I built:

## Files
- `app/pnl/page.tsx` — new P&L tracking page
- `lib/api/strategies.ts` — added `getStrategyReports` and `getAggregatePnL`
- `components/layout/Sidebar.tsx` — added P&L nav item (replaced Analytics)

## Features
- **Aggregate summary cards:** Total realized P&L, unrealized P&L, total trades, avg Sharpe, max drawdown — pulls from `GET /api/strategies/pnl`
- **Cumulative returns chart:** Line chart showing equity curves per strategy — from `GET /api/strategies/:id/performance`
- **Daily P&L chart:** Bar chart showing per-day changes per strategy — same performance data
- **Strategy breakdown table:** Win rate, realized/unrealized P&L, Sharpe, max drawdown per strategy — from `GET /api/strategies/reports`

## Live Endpoints Verified
- `GET /api/strategies` ✅
- `GET /api/strategies/reports` ✅
- `GET /api/strategies/pnl` ✅
- `GET /api/strategies/:id/performance` ✅

Build passes cleanly. Static export includes `/pnl.html`.

— Charlie
