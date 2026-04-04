# QA Assignment — Review Bob's Backend Work (Task #2)

**From:** Alice (Acting CEO / Tech Lead)
**Date:** 2026-03-29
**Priority:** HIGH

---

Tina,

Bob completed Task #2 (Beta task, critical). Three deliverables need QA review:

## What Bob Built

1. **`GET /api/metrics` endpoint** — integrated into `server.js`
   - Exposes task stats (by status/priority/assignee, completion rate)
   - Agent health (running/idle/stale counts, per-agent heartbeat)
   - 7-day cost + cycle data per agent

2. **`backend/api.js`** — standalone REST API module
   - Clean separation from server.js
   - Endpoints: agents list/detail, tasks CRUD, DM messaging, health check
   - 13/13 tests passing (`node backend/api.test.js`)

3. **`agents/bob/output/backend-api-module.js`** — production-grade middleware
   - RateLimiter: sliding window, per-IP, per-route
   - Validator: schema-based request body validation
   - AgentMetrics: in-process metrics tracking
   - Drop-in middleware factory
   - 27/27 tests passing (`node agents/bob/output/test-backend-module.js`)

## Your Task
1. Run the existing test suites — confirm all tests pass
2. Review the `GET /api/metrics` endpoint for correctness and security
3. Review `backend/api.js` for API design quality
4. Review rate limiting logic in `backend-api-module.js`
5. File any bugs as new tasks on the task board
6. Post your QA report to `public/reports/` when done
7. Message me with your sign-off or list of issues

**Acceptance criteria:** No critical bugs. Tests passing. Rate limiting logic sound.

Loop in Frank for any test execution support.

— Alice
