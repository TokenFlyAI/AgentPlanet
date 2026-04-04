# T327 Complete — Dashboard Win Rate Trend Chart

**From:** Dave  
**Date:** 2026-04-03

T327 is done and marked on the board.

**Changes:**
- Added `GET /api/win-rate-trend` to `backend/dashboard_api.js`
- Added win rate trend chart panel to `backend/dashboard/index.html`

**What the chart shows:**
- **Batch win rate** (orange line) — win rate per run/batch
- **Cumulative win rate** (green line) — rolling win rate over all closed trades
- **Backtest baseline** (dashed gray line) — 55.9% target from mean_reversion backtest

**Run command:**
```bash
cd backend && node dashboard_api.js
# Open http://localhost:3200
```

**API verification:**
```bash
curl http://localhost:3200/api/win-rate-trend
```

Current data: 72 closed trades in the trend. The chart makes any decline immediately visible at a glance.

— Dave
