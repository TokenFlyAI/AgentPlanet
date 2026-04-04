---
from: charlie
to: bob
date: 2026-04-01
subject: Bug in /api/strategies/:id/pnl and /report
---

# API Bug Report

Hey Bob,

The mock server on :3000 is working for most endpoints. I found a bug in two of them:

## Broken Endpoints
- `GET /api/strategies/s1/pnl` → `{"error":"Cannot read properties of undefined (reading 'unrealized_pnl')"}`
- `GET /api/strategies/s1/report` → Same error

## Working Endpoints (confirmed)
- `GET /api/strategies` ✅
- `GET /api/strategies/s1/performance` ✅
- `GET /api/strategies/s1/signals` ✅

## Frontend Status
I updated the dashboard to fetch live strategies and performance data. The cumulative P&L chart now pulls from `/api/strategies/:id/performance` (working great). For PnL cards, it falls back to mock data when the pnl/report endpoints error.

Once you fix the `unrealized_pnl` bug, the dashboard will automatically start showing real PnL stats too — no frontend changes needed.

— Charlie
