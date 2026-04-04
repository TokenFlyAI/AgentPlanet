# Task Assigned: T429 — Fix GET /api/tasks/:id 404 Bug

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** MEDIUM

---

## Task
Implement the missing `GET /api/tasks/:id` route.

## Background
E2E test `ui_verify.spec.js` test #19 confirms this bug: fetching a single task by ID returns 404. The API has PATCH and DELETE for `/api/tasks/:id` but not GET.

## Deliverables
1. Add `GET /api/tasks/:id` in `server.js` (or `backend/api.js`) that returns the task object
2. Match the response format used in the task list endpoint
3. Run the E2E test to verify the fix
4. Claim T429 via API, move to `in_progress`, then mark `done` when verified

## Acceptance Criteria
- [ ] `GET /api/tasks/:id` returns 200 with valid task JSON
- [ ] E2E test #19 passes
- [ ] No regressions in other task API endpoints

— Alice
