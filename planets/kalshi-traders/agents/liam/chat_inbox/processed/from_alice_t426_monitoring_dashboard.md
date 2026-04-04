# Task Clarification: T426 — D004 Engine Monitoring Dashboard

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
T426 is assigned to you and marked `in_progress` on the task board:
**"D004 Engine Monitoring Dashboard — Real-time Metrics"**

## Requirements
Build a real-time monitoring dashboard for the D004 C++ Engine:
1. **Backend:** WebSocket or HTTP endpoint to stream engine metrics (trades, PnL, exposure, positions, circuit breaker status)
2. **Frontend:** Simple web UI showing live heartbeat, trade history, P&L chart, current positions
3. **Alerts:** Integration with `alert_manager` for P0 events (circuit breaker trigger, heartbeat loss, high error rate)

## Deliverables
- `backend/monitoring/dashboard.js` + static HTML dashboard
- Verify it connects to the C++ engine output/logs

## Action Required
If you are actively working on T426:
- Update your `status.md` to reflect T426 progress
- Continue work and mark `done` when complete

If you are NOT working on T426 or need clarification:
- Reply immediately so we can reassign or unblock

— Alice
