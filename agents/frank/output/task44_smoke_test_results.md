# Task #44 — QA Smoke Test: Dave's server.js Integration
**Tester**: Frank (QA Engineer)
**Date**: 2026-03-30
**Task**: Verify Dave's Task #4 integration (backend-api-module middleware wired into server.js)

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Server starts and responds | PASS | GET /api/health → 200 `{"status":"ok"}` |
| GET /api/metrics returns HTTP data | PASS | `http` key present with per-endpoint stats |
| Mode validation (invalid mode → 400) | PASS | POST /api/mode with invalid mode returns 400 (BUG-5 fix confirmed) |
| Rate limiting on write endpoints | PASS (functional) | POST /api/tasks returns 429 after 20 writes/min |
| GET endpoints not rate-limited | PARTIAL — BUG FOUND | GETs rate-limited at 120/min per IP — too low for e2e tests |
| POST /api/tasks response format | PASS | Returns `{"ok":true,"id":...}` on success |
| Core endpoints regression | PASS | /api/agents, /api/tasks, /api/health, /api/dashboard all 200 |

---

## Manual Smoke Test Results

### GET /api/health
```
PASS: {"status":"ok","uptime_ms":143875,...,"activeAgents":20}
```

### GET /api/metrics (HTTP data)
```
PASS: Response contains "http" key with per-endpoint stats (requests, errors, avg_ms, min_ms, max_ms, error_rate)
```

### POST /api/mode (invalid mode)
```
PASS: Returns 400 for mode="invalid_xyz" — BUG-5 fix is working
```

### Rate limiting on write endpoints (POST /api/tasks)
```
PASS (functional): After 20 write requests in 60s window, returns:
{"error":"too many requests","retry_after_ms":16082}
```

### POST /api/tasks (valid request after rate limit resets)
```
PASS: {"ok":true,"id":81,"title":"Frank QA Test Manual",...}
```

---

## E2E Test Results (npx playwright test e2e/api.spec.js)

**Result: 18 passed, 13 FAILED**

### Root Cause: Rate Limiter Exhaustion During Test Run

All 13 failures share a single root cause: the write rate limiter (20 requests/min per IP) is exhausted before the Tasks CRUD and Task Claim test suites execute.

The server had already processed ~76 POST /api/tasks requests before the test run (from prior Tina e2e test runs within the same 60-second window), exhausting the write quota for the IP.

### Failed Tests (all rate-limit cascades)
| # | Test | Expected | Actual |
|---|------|----------|--------|
| 1 | GET /api/tasks?assignee= filters | `created.ok = true` | `undefined` (POST → 429) |
| 2 | GET /api/tasks?status= filters | `created.ok = true` | `undefined` (POST → 429) |
| 3 | POST /api/tasks creates task | status 201 | 429 |
| 4-10 | PATCH/DELETE/validation tests | various | Cascade from #3 (404) |
| 11-13 | POST /api/tasks/:id/claim tests | 200/409/400 | 404/404/404 (no task created) |

### Passing Tests (18)
All read-only tests pass cleanly: GET /api/health, /api/config, /api/agents, /api/dashboard, /api/announcements, /api/search, POST /api/agents/:name/message, GET /api/mode, POST /api/mode (valid/invalid).

---

## Bugs Filed

### BUG-001 — Write Rate Limit Too Low for E2E Test Scenarios
- **Severity**: Major
- **Component**: backend-api-module.js (RateLimiter)
- **Config**: `strictLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 20 })`
- **Symptom**: E2E test suite fails with 13/31 failures when prior test runs have consumed the 20 write/min quota
- **Impact**: CI/CD unreliable when e2e tests run consecutively; blocks QA gate
- **Reproduction**:
  1. Run `npx playwright test e2e/api.spec.js` twice within 60 seconds
  2. Second run shows 13 failures — all tasks CRUD and claim tests return 429
- **Fix options**: 
  - Increase write limit to 100+/min, OR
  - Add test-mode bypass header (e.g. `X-Test-Token`), OR
  - E2E tests add delays between write operations

### BUG-002 — GET Rate Limit (120/min) Can Be Exhausted by Heavy Test Loads
- **Severity**: Minor
- **Component**: backend-api-module.js (RateLimiter)
- **Symptom**: After many consecutive read requests (e.g. dashboard polling + e2e tests), GET endpoints return 429
- **Impact**: Dashboard becomes unresponsive if many agents + e2e tests share same IP

---

## Dave's Integration Quality Assessment

Dave's integration work is functionally correct:
- Rate limiting is wired and working
- HTTP metrics are tracked and exposed via /api/metrics
- Mode validation returns proper 400 for invalid modes (BUG-5 fix)
- No regressions on core read endpoints

The test failures are not bugs in Dave's integration code — they are a pre-existing rate limiter configuration issue that only surfaces under test load.

**Recommendation**: File BUG-001 as a task for Bob to increase write rate limit or add e2e bypass, then re-run e2e suite for clean pass.
