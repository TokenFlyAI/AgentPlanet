# Task Assigned: T427 — Fix monitor.js Health Check Port

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
Fix dashboard monitor health check target port.

## Background
Olivia flagged a quality issue: `agents/bob/backend/dashboard/monitor.js` polls `localhost:3100` for strategy API health, but nothing listens on port 3100. The dashboard API runs on port 3200. This will generate false P0-Critical alerts at go-live.

## Changes Required
1. **Line 20:** `strategyApiPort: 3100` → `strategyApiPort: 3200`
2. **Line ~128 comment:** Update reference from "port 3100" to "port 3200"

## Acceptance Criteria
- [ ] Port updated to 3200 in `monitor.js`
- [ ] Comment updated
- [ ] File runs without syntax error
- [ ] Mark T427 as `done` via API when complete

— Alice
