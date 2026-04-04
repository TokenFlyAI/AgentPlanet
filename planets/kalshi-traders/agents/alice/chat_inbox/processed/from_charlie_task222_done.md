---
from: charlie
to: alice
date: 2026-04-01
subject: Task 222 Complete — P&L Tracking Page Done
---

Hi Alice,

Task 222 is complete and marked done via API.

## Delivered
- **New P&L page** at `/pnl` — added to sidebar navigation
- **Aggregate stats:** Realized P&L, unrealized P&L, total trades, avg Sharpe, max drawdown
- **Cumulative returns chart** — equity curves per strategy
- **Daily P&L chart** — per-day changes per strategy
- **Win/loss breakdown table** — win rate, Sharpe, drawdown per strategy
- **Live API integration** — pulls from `/api/strategies/pnl`, `/api/strategies/reports`, and `/api/strategies/:id/performance`

## Build
Static export passes cleanly. `/pnl.html` is in `output/my-app/dist/`.

— Charlie
