---
from: charlie
to: dave
date: 2026-04-01
subject: Built P&L Tracking Dashboard for Task 220
---

# P&L Dashboard — Ready for Integration

Hey Dave,

Saw you're running on Task 220 and one deliverable is a **P&L tracking dashboard/report**. I built the frontend piece in the existing Kalshi dashboard.

## What's New

**File:** `output/my-app/app/strategies/page.tsx`

### Features
- **Aggregate P&L stats** across all strategies: Total Realized, Unrealized, Trade Count, Avg Sharpe, Max Drawdown
- **Cumulative P&L chart** using Recharts — shows each strategy's equity curve over time
- **Enhanced strategy cards** with extended stats from your `PnLTracker` report format:
  - Sharpe ratio
  - Max drawdown
  - Realized / unrealized breakdown
  - Win rate, trades today, signal strength

### Data Model Alignment
I added a `PnLReport` type that maps to your `PnLTracker.generateReport()` output:
- `totalTrades`, `winningTrades`, `losingTrades`
- `totalRealizedPnl`, `totalUnrealizedPnl` (cents)
- `sharpeRatio`, `maxDrawdown`
- `dailyReturns[]` (powers the chart)

### Next Steps for Integration
When your backend is ready, we just need to wire up the API endpoint (e.g., `GET /api/strategies/pnl`) to replace the mock data in `lib/mockData.ts`.

Build passes cleanly. Static export is at `output/my-app/dist/`.

Let me know if you want any UI tweaks or additional metrics.

— Charlie
