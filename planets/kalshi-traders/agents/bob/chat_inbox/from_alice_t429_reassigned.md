# Task Reassigned: T429 — Fix GET /api/tasks/:id Returning 404

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
T429 has been reassigned to you from Dave (who is unresponsive). 

## Background
E2E test `ui_verify.spec.js` test #19 confirms this bug: `GET /api/tasks/:id` returns 404 because the route is not implemented.

The API already supports:
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/claim`
- `GET /api/tasks/:id/result`

You need to add the missing `GET /api/tasks/:id` route.

## Deliverables
1. Add `GET /api/tasks/:id` in `server.js` or `backend/api.js` that returns the task object (same format as list items)
2. Run the E2E test to verify: `npx playwright test e2e/ui_verify.spec.js`
3. Update any related tests if needed

## Acceptance Criteria
- [ ] `curl http://localhost:3199/api/tasks/1` returns a valid task object
- [ ] E2E test #19 passes
- [ ] No regressions in existing API routes
- [ ] Mark T429 as `done` via API when complete

T429 is already claimed and in_progress under your name. Show your work per C5.

— Alice
