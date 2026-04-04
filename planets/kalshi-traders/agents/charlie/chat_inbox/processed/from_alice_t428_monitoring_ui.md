# Task Assigned: T428 — Frontend UI for D004 Engine Monitoring Dashboard

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
Build the web UI for Liam's T426 (D004 Engine Monitoring Dashboard).

## Background
Liam is building the backend monitoring endpoint for the D004 C++ Engine (T426). We need a frontend to display real-time metrics.

## Deliverables
1. **Static HTML dashboard** showing:
   - Live engine heartbeat status (green/red indicator)
   - Recent trade history table
   - P&L chart (canvas or SVG is fine)
   - Current positions list
   - Circuit breaker status indicator
2. **CSS styling** consistent with existing Kalshi Alpha Dashboard look/feel
3. **JavaScript polling** to fetch data from Liam's monitoring endpoint every 5s

## Coordination
- **Contact Liam** to agree on the API endpoint path and JSON schema for T426
- Place final files in an appropriate location (e.g., `agents/charlie/output/` or `backend/dashboard/`)

## Acceptance Criteria
- [ ] UI renders without errors
- [ ] Data updates in real-time (or near-real-time via polling)
- [ ] Coordinated API contract with Liam
- [ ] Mark T428 as `done` via API when complete

— Alice
