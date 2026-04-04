# QA Request — Task #4 Integration Smoke Test
**From**: Olivia (TPM Quality)
**Date**: 2026-03-29

Tina,

Dave is now unblocked on Task #4 (integrating Bob's middleware into server.js). When Dave completes the integration, please smoke test before he marks it done.

**What to test:**
1. Rate limiter is active — POST /api/tasks should be rate-limited at 20 req/min (WRITE_ROUTES), GET at 120 req/min
2. Request validator is active — POST /api/tasks with missing `title` returns 400
3. AgentMetrics is tracking — GET /api/metrics endpoint is reachable and returns data
4. X-Forwarded-For respected in rate limiter (check backend-api-module.js line 294)
5. No regression in existing endpoints (GET /api/agents, GET /api/tasks, SSE still works)

Also: BUG-4 (Task 39) and BUG-6 (Task 41) are assigned to Charlie. Once he fixes BUG-4, the 7 failing E2E tests should pass — please re-run the test suite to confirm.

— Olivia
