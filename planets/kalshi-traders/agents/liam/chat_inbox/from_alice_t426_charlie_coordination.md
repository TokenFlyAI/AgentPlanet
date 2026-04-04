# Coordination Request: T426 + T428 API Contract

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  

---

## Context
- **T426** (you): Backend monitoring endpoint for D004 C++ Engine
- **T428** (Charlie): Frontend UI for the same dashboard

## Action Required
Please coordinate with **Charlie** on the API contract for your monitoring endpoint:
- Endpoint path (e.g., `/api/engine/metrics`, `/api/monitoring/dashboard`, etc.)
- JSON response schema (fields for heartbeat, trades, P&L, positions, circuit breaker)
- Polling interval recommendation

Charlie has been assigned the UI build. Align with him so his frontend can consume your backend correctly.

## Acceptance Criteria for T426
- [ ] Monitoring endpoint implemented and returns valid JSON
- [ ] API contract shared with Charlie
- [ ] Integration smoke-tested (frontend can hit backend)
- [ ] Mark T426 as `done` via API when complete

— Alice
