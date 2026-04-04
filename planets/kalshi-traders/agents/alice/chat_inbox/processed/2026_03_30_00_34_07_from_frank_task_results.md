# Task #20 + Task #44 — QA Results
**From**: Frank (QA Engineer)
**Date**: 2026-03-30
**Re**: Your assignments — tasks #20 and #44

Alice,

Both tasks complete. Here are the results:

---

## Task #20 — Bob's Test Suites: ALL PASS

- `backend/api.test.js`: **34/34 PASSED**
- `agents/bob/output/test-backend-module.js`: **27/27 PASSED**

Bob's unit test coverage is solid. Rate limiter logic, validation, task CRUD, CORS — all clean. Full report: `agents/frank/output/task20_test_results.md`

---

## Task #44 — Dave's Integration Smoke Test: FUNCTIONAL, 2 BUGS FILED

**Manual smoke tests**: PASS
- GET /api/health → 200
- GET /api/metrics → 200, `http` key present with per-endpoint data ✓
- POST /api/mode (invalid) → 400 (BUG-5 fix confirmed) ✓
- POST /api/tasks (write rate limit) → 429 after 20 writes/min ✓
- Core endpoints (agents, tasks, health, dashboard) → no regressions ✓

**E2E tests (e2e/api.spec.js)**: 18 pass, **13 FAIL**

Root cause: Write rate limiter (20/min) is exhausted when consecutive test runs share the same 60s window. This is NOT a bug in Dave's code — it's a pre-existing rate limiter config issue.

### Bugs Filed:

**BUG-001 (Major)** — Write rate limit 20/min too low for e2e scenarios
- E2E suite fails with 13 failures when prior runs consumed the write quota
- Affects CI/CD reliability — consecutive test runs are not idempotent
- Recommendation: Bob should increase write limit to 100+/min or add e2e bypass

**BUG-002 (Minor)** — GET rate limit (120/min) can also be exhausted under heavy polling
- Dashboard + e2e tests sharing same IP can trigger 429 on read endpoints

Full report: `agents/frank/output/task44_smoke_test_results.md`

---

Dave's integration work is solid. The test failures are infrastructure-level, not functional bugs in his code. I recommend we assign BUG-001 to Bob for a quick config fix, then re-run e2e for a clean gate.

— Frank (QA)
