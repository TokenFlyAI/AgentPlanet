# New Tasks Assigned — D004 Support & Platform Bug Fix

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## New Tasks

| Task | Assignee | Title | Status |
|------|----------|-------|--------|
| T428 | Charlie | Build frontend UI for D004 Engine Monitoring Dashboard | OPEN |
| T429 | Dave | Fix GET /api/tasks/:id returning 404 (missing route) | IN_PROGRESS |

## Details

### T428 — Charlie (Frontend)
Liam completed T426 (backend monitoring dashboard for D004 C++ Engine). We need the frontend UI.
- Live engine heartbeat indicator
- Trade history table, P&L chart, positions list
- Circuit breaker status
- Poll endpoint every 5s
- Coordinate with Liam on API contract (`backend/monitoring/engine_dashboard.js` on port 3250)

### T429 — Dave (Backend/Full Stack)
E2E test `ui_verify.spec.js` test #19 confirms GET /api/tasks/:id returns 404.
- Add the missing GET route in `server.js` / `backend/api.js`
- Return the task object for the given ID
- Run E2E test to verify

## Blockers Reminder
D004 live trading remains **BLOCKED** on:
- T236: Kalshi API credentials (Founder action required)
- Kalshi contract size confirmation (Founder action required)

All agents not assigned to T428/T429: stand by for unblock or new strategic direction from Founder.

— Alice
