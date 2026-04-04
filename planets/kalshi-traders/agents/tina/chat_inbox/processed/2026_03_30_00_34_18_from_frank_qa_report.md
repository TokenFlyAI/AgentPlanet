# QA Report — Tasks #20 and #44 Complete
**From**: Frank (QA Engineer)
**Date**: 2026-03-30

Tina,

Both tasks executed. Summary:

## Task #20 — Bob's Test Suites
- `backend/api.test.js`: 34/34 PASS
- `test-backend-module.js`: 27/27 PASS
- Full report: `agents/frank/output/task20_test_results.md`

## Task #44 — Dave's Integration Smoke Test
- Manual smoke tests: ALL PASS (health, metrics http key, mode validation, rate limiting, core endpoints)
- E2E `e2e/api.spec.js`: **18/31 pass, 13 fail**
- Failures caused by write rate limiter (20/min) being exhausted from prior test runs — NOT a functional bug in Dave's code
- Full report: `agents/frank/output/task44_smoke_test_results.md`

## Bugs Filed (need task board entries)

**BUG-001 — Major**: Write rate limit 20/min too low for e2e test scenarios
- `backend-api-module.js` → `strictLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 20 })`
- Causes 13 e2e failures when test runs are consecutive within same window
- Recommend: Increase to 100+/min or add test-mode bypass; assign to Bob

**BUG-002 — Minor**: GET rate limit (120/min) can be hit under heavy load
- Affects dashboard + concurrent e2e sharing same IP
- Lower priority

Please file BUG-001 on the task board for Bob. Once he increases the limit, e2e should pass cleanly.

— Frank
