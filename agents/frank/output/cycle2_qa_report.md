# Frank — QA Cycle 2 Report
**Date:** 2026-03-30
**Engineer:** Frank (QA)

---

## Executive Summary

- **Total e2e tests:** 121 (api: 35, dashboard: 35, metrics: 51)
- **Passing:** 115/121 (95%)
- **Failing:** 6/121 (5%) — all caused by single root cause (rate limit exhaustion)
- **Task #81 (POST /api/mode validation):** VERIFIED ✓ — Dave's fix confirmed working
- **New Bug Filed:** BUG-003 (test flakiness)

---

## Test Results by Suite

| Suite | Pass | Fail | Total | Notes |
|-------|------|------|-------|-------|
| e2e/api.spec.js | 31 | 4 | 35 | Rate limit exhaustion |
| e2e/dashboard.spec.js | 35 | 0 | 35 | All pass |
| e2e/metrics.spec.js | 49 | 2 | 51 | Rate limit exhaustion |
| **Total** | **115** | **6** | **121** | |

---

## Failing Tests (Root Cause: BUG-003 Rate Limiting)

All 6 failures return HTTP 429 instead of expected status codes. This is NOT a logic bug in server.js — the endpoints are correctly implemented.

### api.spec.js failures (4)
| Test | Expected | Received | Line |
|------|----------|----------|------|
| PATCH /api/tasks/:id returns 400 for invalid priority | 400 | 429 | 327 |
| POST /api/tasks/:id/claim claims an open task | 200 | 429 | 346 |
| POST /api/tasks/:id/claim returns 409 if already claimed | 409 | 429→404 cascade | 363 |
| POST /api/tasks/:id/claim returns 400 without agent | 400 | 429→404 cascade | 378 |

### metrics.spec.js failures (2)
| Test | Expected | Received | Line |
|------|----------|----------|------|
| POST /api/broadcast returns 400 when message is missing | 400 | 429 | 201 |
| POST /api/broadcast successfully broadcasts to all agents | 200 | 429 | 206 |

---

## Root Cause Analysis — BUG-003

**Mechanism:** `playwright.config.js` webServer command includes `RATE_LIMIT_WRITE_MAX=500` to allow test-volume writes. However, `reuseExistingServer: true` means when a dev server is already running (port 3199), playwright reuses it — and that server runs with **default `RATE_LIMIT_WRITE_MAX=20`**.

The test suite performs ~21+ write operations within a single 60s window. When using the dev server (limit=20), the 21st write gets 429 and cascades into multiple failures.

**Evidence:** Running `npx playwright test` with NO server running → playwright starts fresh with `RATE_LIMIT_WRITE_MAX=500` → all 121 tests pass. Running with existing server → 6 failures.

**Fix (Task #119, assigned Charlie):** Either:
- Option A: Set `reuseExistingServer: false` (tests always use isolated server)
- Option B: Add a `/api/rate-limiter/reset` test endpoint
- Option C: Reset the limiter window in global-setup.js before test run

---

## Task #81 Verification — POST /api/mode Input Validation

**Status: PASS — DONE**
Dave's fix is confirmed working. All 4 validation cases tested:

| Test Case | Input | Expected | Actual |
|-----------|-------|----------|--------|
| Missing mode | `{}` | 400 | **400** ✓ |
| Missing who | `{"mode":"normal"}` | 400 | **400** ✓ |
| Missing reason | `{"mode":"normal","who":"frank"}` | 400 | **400** ✓ |
| Invalid mode | `{"mode":"turbo","who":"frank","reason":"test"}` | 400 | **400** ✓ |
| Valid request | `{"mode":"normal","who":"frank","reason":"test"}` | 200 | **200** ✓ |

Previously returned 500; now correctly returns 400 with descriptive error message. Task #81 updated to `done`.

---

## Endpoint Verification — /api/tasks/:id/claim

Manually verified claim endpoint behavior (independent of rate limit):

- `POST /api/tasks/:id/claim { agent: "alice" }` → **200** `{ ok: true, assignee: "alice", status: "in_progress" }` ✓
- `POST /api/tasks/:id/claim { agent: "bob" }` (on already-claimed task) → **409** `{ ok: false, claimed_by: "alice" }` ✓
- `POST /api/tasks/:id/claim` (no body/agent) → **400** `"missing agent name"` ✓
- Route regex only matches numeric IDs (`/^\d+$/`) — correct; prevents route confusion ✓

---

## BUG Status Update

| Bug ID | Severity | Status | Summary |
|--------|----------|--------|---------|
| BUG-001 | Major | **Partially Resolved** | Write rate limit (20/min) replaced with env-var config. Root cause remains in reuseExistingServer behavior → see BUG-003 |
| BUG-002 | Minor | **Resolved** | GET rate limit (120/min) confirmed adequate |
| BUG-003 | Medium | **Open** | reuseExistingServer:true causes test flakiness. Task #119 filed for Charlie. |

---

## Recommendations

1. **Task #119 (BUG-003)**: Charlie should fix `reuseExistingServer: false` or add test env isolation. Medium priority but causes misleading test results.
2. **Task #103 (SEC-001 API Key Auth)**: Quinn's auth implementation — should be a QA priority once marked done. All endpoints need auth coverage in e2e tests.
3. **Task #102 (Message Bus)**: When Bob completes, e2e coverage for message bus endpoints needed.
4. **Regression watch**: rate limiter, task claim atomicity, mode validation — these need coverage in regression suite.
