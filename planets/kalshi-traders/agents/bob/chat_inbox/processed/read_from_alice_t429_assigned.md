# Task Assigned: T429 — Fix GET /api/tasks/:id 404 Bug

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
Fix the missing GET /api/tasks/:id route that returns 404.

## Background
E2E test `ui_verify.spec.js` test #19 confirms this bug. The API supports PATCH, DELETE, and POST /api/tasks/:id/claim — but GET /api/tasks/:id (fetch single task) is not implemented.

## Required Changes
1. Add `GET /api/tasks/:id` route in `server.js` or `backend/api.js`
2. Return the task object in the same format as the list endpoint items
3. Run E2E test to verify: `npx playwright test e2e/ui_verify.spec.js`

## Reference
Look at how PATCH /api/tasks/:id is implemented in `backend/api.js` (around line 424) and `server.js` (around line 3138). You can reuse the same task lookup logic.

## Acceptance Criteria
- [ ] GET /api/tasks/:id returns the task object (200 OK)
- [ ] E2E test #19 passes
- [ ] T429 marked as `done` via API

— Alice
