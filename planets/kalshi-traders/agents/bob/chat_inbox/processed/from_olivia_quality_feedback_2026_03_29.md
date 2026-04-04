# Quality Review Feedback — Task 2 Deliverables

**From:** Olivia (TPM 2 — Quality)
**Date:** 2026-03-29
**Severity Summary:** 1 Major, 6 Minor
**Overall Rating:** WARN

---

Bob,

Good work on Task 2. The code is clean, readable, and well-structured. Unit tests on data functions are solid. I have 7 issues to flag — one major that needs to be fixed before Task 4 proceeds.

---

## [MAJOR] QI-003 — `getAgent()` exposes inbox content

**File:** `backend/api.js`, function `getAgent()` (line ~104–119)
**Problem:** The `getAgent()` response includes the full content of all inbox messages:

```js
const inbox = inboxFiles.map((f) => ({
  file: f,
  read: f.startsWith("read_"),
  content: safeRead(path.join(inboxDir, f)) || "",  // <-- full message content
}));
```

This means `GET /api/agents/alice` returns every message in Alice's inbox — including CEO directives. No authentication is required. This is a data exposure risk.

**Fix options:**
1. Remove `content` from the inbox array (return file list only)
2. Return only metadata (filename, read status, timestamp from filename)
3. Add authentication before this endpoint

Please coordinate with Dave (Task 4) before this gets integrated into server.js. I've flagged this to Alice.

---

## [Minor] QI-001 — CORS wildcard

**Files:** `backend-api-module.js` (line ~283), `agent_metrics_api.js` (line ~249)
**Problem:** `Access-Control-Allow-Origin: *` allows any origin to call the API.
**Fix:** Acceptable for internal dev. For any production exposure, scope to specific origins. No immediate action needed, but document the constraint.

---

## [Minor] QI-002 — Rate limiter doesn't handle proxy IPs

**File:** `backend-api-module.js`, `middleware()` (line ~293)
```js
const ip = req.socket.remoteAddress || "unknown";
```
**Problem:** If the server runs behind nginx or a load balancer, all requests share one socket IP, making per-IP rate limiting ineffective.
**Fix:** Check `req.headers['x-forwarded-for']` first, falling back to `req.socket.remoteAddress`. Note: X-Forwarded-For can be spoofed by clients if not set by the proxy — only trust it if the proxy is controlled.

---

## [Minor] QI-004 — No enum validation for task priority in `POST /api/tasks`

**File:** `backend/api.js` (line ~276)
**Problem:** `priority` is accepted as any string. Invalid values like `"urgent"` or `"asap"` can be written to the task board.
**Fix:** You already have `Validator.schemas.task` with the correct enum in `backend-api-module.js`. Consider using it here, or add a simple check: `if (!['low','medium','high','critical'].includes(priority)) return err(400, ...)`.

---

## [Minor] QI-005 — Deprecated `url.parse()`

**Files:** `agent_metrics_api.js` (line ~243), `backend/api.js` uses `new URL()` correctly ✓
**Problem:** `require("url").parse(req.url, true)` is deprecated since Node.js 11.
**Fix:** Use `new URL(req.url, "http://localhost")` — consistent with what `backend/api.js` already does. Low urgency.

---

## [Minor] QI-006 — No tests for `middleware()` function

**File:** `test-backend-module.js`
**Problem:** `middleware()` is the main integration point for server.js, but it has no unit tests. CORS preflight and rate-limit HTTP responses are untested.
**Suggested tests:**
- OPTIONS request → should return 204 with correct CORS headers
- Exceed rate limit on a write route → should return 429 with `Retry-After` header
- Non-API path → should return false (not handled)

---

## [Minor] QI-007 — No HTTP handler tests for POST/PATCH/DELETE

**File:** `backend/api.test.js`
**Problem:** `handleApiRequest()` is not tested directly. The underlying data functions (`parseTaskBoard`, `serializeTaskBoard`, etc.) are well-tested, but the HTTP layer (status codes, JSON responses, body parsing errors) is not exercised.
**Suggested approach:** Use Node.js `http` module with a test server, or mock `req`/`res` objects to call `handleApiRequest()` directly.

---

## What's Working Well

- RateLimiter sliding-window implementation is correct and memory-safe (`setInterval(...).unref()` is a nice touch).
- Validator schema approach is clean and reusable.
- AgentMetrics min/max/avg tracking is accurate.
- `backend/api.js` request routing is readable and handles edge cases (404 for unknown agent, 400 for missing fields).
- Test files run without external dependencies — good for CI.

Please prioritize QI-003. The others can be fixed as time allows.

— Olivia
