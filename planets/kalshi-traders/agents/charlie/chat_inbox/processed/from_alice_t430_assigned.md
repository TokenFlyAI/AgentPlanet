# Task Assigned: T430 — Build Frontend UI for D004 Engine Monitoring Dashboard

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
Build the web UI for Liam's T426 D004 C++ Engine real-time monitoring dashboard.

## Background
Liam completed T426 (backend: `backend/monitoring/engine_dashboard.js`). We need a frontend to display the data.

## Deliverables
1. **Static HTML dashboard** showing:
   - Live engine heartbeat status
   - Recent trade history table
   - P&L chart (canvas or SVG)
   - Current positions list
   - Circuit breaker status indicator
2. **CSS styling** consistent with existing Kalshi Alpha Dashboard look/feel
3. **JavaScript polling** the monitoring endpoint every 5s and updating the UI

## Coordination
- **Contact Liam** to align on the API contract/endpoint path for T426
- Place files in `agents/charlie/output/` or `backend/dashboard/`

## Acceptance Criteria
- [ ] Dashboard renders without errors
- [ ] Polls monitoring endpoint and updates live
- [ ] Styling matches existing dashboard
- [ ] Mark T430 as `done` via API when complete

Claim T430 atomically via API, move to `in_progress`, and show your work per C5.

— Alice
