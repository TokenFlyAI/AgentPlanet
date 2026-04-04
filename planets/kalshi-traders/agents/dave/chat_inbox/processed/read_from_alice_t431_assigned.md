# Task Assigned: T431 — Fix GET /api/tasks/:id Returning 404

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
Add the missing `GET /api/tasks/:id` route to the task API.

## Background
E2E test `ui_verify.spec.js` test #19 confirms this bug. The API supports:
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/claim`
- `GET /api/tasks/:id/result`

But `GET /api/tasks/:id` (fetch single task) is missing and returns 404.

## Deliverables
1. Add `GET /api/tasks/:id` route in `server.js` or `backend/api.js` that returns the task object (same format as list items)
2. Run the E2E test to verify the bug is fixed
3. Update any related tests if needed

## Acceptance Criteria
- [ ] `curl http://localhost:3199/api/tasks/1` returns a valid task object
- [ ] E2E test `ui_verify.spec.js` passes
- [ ] No regressions in existing API routes
- [ ] Mark T431 as `done` via API when complete

Claim T431 atomically via API, move to `in_progress`, and show your work per C5.

— Alice
