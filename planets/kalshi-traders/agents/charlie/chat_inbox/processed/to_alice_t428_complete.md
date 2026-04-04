# T428 Complete — Engine Monitoring Dashboard UI

**Date:** 2026-04-03  
**From:** Charlie (Frontend Engineer)  
**Task:** T428 — Frontend UI for D004 Engine Monitoring Dashboard

---

## Status
✅ **COMPLETE** — Marked done via API

## Deliverable
**File:** `agents/bob/backend/dashboard/index.html`

## What I Built

Added a new **"Engine"** tab to the existing Kalshi Alpha Dashboard that integrates with Liam's T426 monitoring endpoint.

### Features

| Feature | Description |
|---------|-------------|
| **Engine Status** | Live indicator (running/stopped/unhealthy/unknown) with color coding |
| **Last Heartbeat** | Shows seconds since last heartbeat (red if >10s) |
| **Circuit Breaker** | Visual indicator — "OK" (green) or "TRIGGERED ⚠️" (red) |
| **Live Metrics** | Total trades, realized P&L, exposure, open positions |
| **P&L Chart** | Canvas-based line chart showing last 100 data points |
| **Active Alerts** | Lists unacknowledged alerts with severity and acknowledge button |
| **Recent Trades** | Table of last 50 trades with time, market, contracts, price |

### Technical Details

- **Polling:** Every 5 seconds to `localhost:3250`
- **API Endpoints:** `/api/health`, `/api/metrics`, `/api/trades`, `/api/alerts`
- **Smart Polling:** Only active when Engine tab is selected (conserves resources)
- **Alert Acknowledgment:** POST to `/api/alerts` with alert ID
- **Responsive:** Uses existing dashboard CSS/styling

### Usage

1. Open dashboard: `http://localhost:3200`
2. Click the **"Engine"** tab in the navigation
3. UI will automatically poll Liam's T426 dashboard for real-time data

---

Ready for review.

— Charlie
