# QA Coordination — Bob's Backend (Task 3)

**From:** Olivia (TPM 2 — Quality)
**Date:** 2026-03-29
**Re:** Task 3 — QA Review of Bob's backend deliverables

---

Tina,

I've completed my quality review of Bob's Task 2 deliverables. Here's what I need from your QA work on Task 3.

## Context

Bob delivered 5 files:
- `agents/bob/output/backend-api-module.js` — RateLimiter, Validator, AgentMetrics, middleware()
- `agents/bob/output/agent_metrics_api.js` — Metrics REST API
- `agents/bob/output/test-backend-module.js` — Unit tests for above
- `backend/api.js` — Main REST API (agents, tasks, messaging)
- `backend/api.test.js` — Unit tests for api.js data functions

## Key QA Gaps to Fill

### Priority 1 — Integration/HTTP Tests (HIGH)

`backend/api.js` HTTP handlers are not tested. The unit tests only cover data functions. We need tests that exercise:
- `GET /api/tasks` — list tasks, filter by assignee/status
- `POST /api/tasks` — create task, verify 201 response, verify board is updated, test missing `title` returns 400
- `PATCH /api/tasks/:id` — update task, test unknown ID returns 404
- `DELETE /api/tasks/:id` — delete task, test unknown ID returns 404
- `POST /api/messages/:agent` — send message, test missing `content` returns 400, test unknown agent returns 404
- `GET /api/health` — smoke test

### Priority 2 — middleware() Tests (MEDIUM)

`backend-api-module.js` `middleware()` is untested:
- OPTIONS → 204 with CORS headers
- API route exceeds rate limit → 429 with `Retry-After` header and correct body
- Non-API path (`/static/foo`) → returns false, no response sent

### Priority 3 — Security Review (HIGH)

Focus on `backend/api.js` `getAgent()` endpoint (I've flagged this as QI-003 to Bob):
- Verify it exposes inbox content to unauthenticated callers
- Document the finding with reproduction steps
- Test should fail until Bob fixes QI-003

### Priority 4 — Input Validation Tests (LOW)

- POST /api/tasks with `priority: "invalid_value"` — currently this silently accepts it (QI-004)
- POST /api/tasks with extremely long `title` — no maxLength validation in api.js handler

## What's Already Tested Well

Bob's unit tests cover:
- RateLimiter (7 test cases) — looks complete
- Validator (7 test cases) — good coverage
- AgentMetrics (8 test cases) — thorough
- parseTaskBoard, serializeTaskBoard, listAgents, getAgent, sendMessage — solid unit coverage

You don't need to re-test these unless you find discrepancies.

## Suggested Test Order

1. Run Bob's existing tests first to establish baseline: `node agents/bob/output/test-backend-module.js` and `node backend/api.test.js`
2. Add HTTP integration tests for api.js handlers
3. Add middleware() tests
4. Document QI-003 as a failing test (security finding)

Please update me when Task 3 is complete or if you find additional issues I should know about.

— Olivia
