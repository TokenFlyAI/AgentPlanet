# QA Report — Bob's Backend Deliverables (Task #2)

**Reviewer:** Tina (QA Lead)
**Date:** 2026-03-29
**Task:** #3 — QA Review of Bob's Backend Work
**Verdict:** CONDITIONALLY APPROVED — 2 bugs must be fixed before integration

---

## Deliverables Reviewed

| Deliverable | Description |
|-------------|-------------|
| `GET /api/metrics` in `server.js` | Task stats, agent health, 7-day cost metrics |
| `backend/api.js` | Standalone REST API module (agents, tasks, messaging) |
| `agents/bob/output/backend-api-module.js` | RateLimiter, Validator, AgentMetrics middleware |
| `agents/bob/output/agent_metrics_api.js` | Metrics API sub-module |

---

## Test Suite Results

| Suite | Location | Result |
|-------|----------|--------|
| backend-api-module | `node agents/bob/output/test-backend-module.js` | **27/27 PASS** |
| backend api.js | `node backend/api.test.js` | **13/13 PASS** |

All 40 tests pass. No failures, no skips.

---

## Code Review Findings

### Rate Limiting (`backend-api-module.js`)

- Sliding window implementation is **correct**. Timestamps outside the window are pruned before each check.
- Per-IP, per-route key isolation is proper — different IPs don't affect each other.
- `setInterval(...).unref()` for pruning is correct: won't keep process alive.
- `strictLimiter` (20 req/min) correctly applied to write routes.
- Window reset time (`resetMs`) correctly calculated as time until oldest request expires.

**Minor issue — see BUG-2 below.**

### Validator (`backend-api-module.js`)

- Schema validation covers all required fields with correct types.
- Enum enforcement, maxLength, pattern, and required checks all work correctly.
- Optional field handling is correct (absent optional fields don't generate errors).
- Convenience schemas cover all API payloads.

**Clean. No issues.**

### AgentMetrics (`backend-api-module.js`)

- Request recording (count, totalMs, errors, min, max) is accurate.
- `error_rate` computation uses `toFixed(4)` — consistent with test expectation `0.3333`.
- `_formatDuration` correctly handles d/h/m/s intervals.
- `reset()` clears all state and resets start time.

**Clean. No issues.**

### `backend/api.js` — REST API Module

- Route matching is correct and consistent.
- Task PATCH correctly validates allowed fields only — no mass-assignment vulnerability.
- Task creation correctly assigns defaults for optional fields.
- Agent name regex `[a-zA-Z0-9_-]+` prevents path traversal via URL.

**See BUG-1 and BUG-3 below.**

### `agents/bob/output/agent_metrics_api.js` — Metrics API

- `DEFAULT_DIR` path resolution (`../../..` from `agents/bob/output/`) correctly resolves to company root.
- Agent liveness logic (heartbeat + log age) is more detailed than `backend/api.js` — good.
- `parseHeartbeat` regex handles both `key: value` and `- **key**: value` formats.
- `extractBlockers` correctly skips "none" entries.
- Method guarding (GET-only for metrics) is correct.

**Minor inconsistency: `url.parse` (deprecated) used instead of `new URL()`. Low severity.**

### `GET /api/metrics` in `server.js`

- Task aggregation (by_status, by_priority, by_assignee) is correct.
- Completion rate calculation is correct.
- Agent health and stale detection logic is consistent with the 5-minute threshold used elsewhere.
- 7-day cost stats delegation to `getAgentCostFromLogs()` is appropriate.

**Clean.**

---

## Bugs Filed

### BUG-1 — MEDIUM — Path Traversal via `from` field in POST `/api/messages/:agent`

**File:** `backend/api.js`, `sendMessage()` function
**Severity:** Medium
**Details:**

The `from` parameter is user-supplied string that gets embedded directly into a filename:
```js
const filename = `${ts}_from_${from}.md`;
safeWrite(path.join(inboxDir, filename), content);
```

`path.join` resolves `..` segments within path strings. A malicious caller can supply `from: "../../malicious"` to write the file outside the intended `chat_inbox/` directory.

Verified:
```
path.join('/agents/alice/chat_inbox', '2026_03_29_22_00_00_from_../../evil.md')
→ '/agents/alice/chat_inbox/evil.md'  (escapes expected subpath)
```

**Fix:** Sanitize the `from` parameter before use in filename. Strip or reject any characters that are not `[a-zA-Z0-9_-]`.

```js
const safeFrom = String(from || "api").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
const filename = `${ts}_from_${safeFrom}.md`;
```

---

### BUG-2 — LOW — `/api/messages/:agent` not in `WRITE_ROUTES`, gets lenient rate limiting

**File:** `agents/bob/output/backend-api-module.js`
**Severity:** Low
**Details:**

`WRITE_ROUTES` controls which endpoints get `strictLimiter` (20 req/min) vs the general `rateLimiter` (120 req/min). `POST /api/messages/:agent` is a write operation that creates files on disk but is not in `WRITE_ROUTES`, so it only gets 120 req/min limit. This allows a burst of 120 DM messages per IP per minute.

**Fix:** Add dynamic `/api/messages/` prefix check to use `strictLimiter` for POST to message endpoints.

---

### BUG-3 — LOW — `GET /api/health` returns `uptime_ms: Date.now()` (wrong value)

**File:** `backend/api.js`, line ~235
**Severity:** Low
**Details:**

```js
return json(200, { status: "ok", uptime_ms: Date.now() });
```

`Date.now()` returns the Unix epoch timestamp in milliseconds, not the server uptime duration. The field name `uptime_ms` implies a duration (e.g., 3600000 = 1 hour). The current value is always ~1.7 trillion ms (Jan 1970 epoch), which is meaningless as uptime.

**Fix:** Track a server start time and compute `Date.now() - startTime`.

---

## Security Assessment

| Area | Finding | Severity |
|------|---------|---------|
| Path traversal (`from` param) | BUG-1 — file write outside intended directory | Medium |
| Rate limiting for message writes | BUG-2 — lenient 120/min instead of 20/min | Low |
| CORS: `Access-Control-Allow-Origin: *` | Wildcard CORS on all endpoints | Info (acceptable for local dev tool) |
| No authentication | All endpoints unauthenticated | Info (acceptable for internal-only tool) |
| Task title injection | Pipe char `|` in title could break markdown table | Info (UI cosmetic only) |
| Deprecated API in `agent_metrics_api.js` | `url.parse()` deprecated, use `new URL()` | Info |

---

## API Design Assessment

**Strengths:**
- Clean REST conventions (GET/POST/PATCH/DELETE used correctly)
- Consistent JSON error format `{ error: "..." }` across all endpoints
- Good use of PATCH for partial updates (allowlist of fields prevents mass-assignment)
- Proper 201 status on resource creation
- Query param filtering on `GET /api/tasks` (`?assignee=`, `?status=`) is a nice touch
- CORS OPTIONS preflight handled correctly in all modules

**Weaknesses / Design Notes:**
- No pagination on `GET /api/agents` or `GET /api/tasks` — will degrade with scale
- `GET /api/agents/:name` returns full inbox content including message bodies — potential data exposure if API becomes externally accessible
- Two separate parsing implementations for task board (`backend/api.js` and `agent_metrics_api.js`) — single source of truth would be cleaner

---

## Verdict

| Criterion | Result |
|-----------|--------|
| All tests passing | PASS (40/40) |
| No critical bugs | PASS |
| Rate limiting logic sound | PASS (with BUG-2 caveat) |
| API design quality | PASS with notes |
| Security review | CONDITIONAL — BUG-1 must be fixed |

**Status: CONDITIONALLY APPROVED**

Bob must fix BUG-1 (path traversal) before `backend/api.js` is deployed or integrated. BUG-2 and BUG-3 are low severity and can be fixed in the next cycle.

The core modules (RateLimiter, Validator, AgentMetrics) are production-quality and approved for integration immediately.

---

## CEO Directive: E2E Tests

CEO message received: `e2e test`. I will author a Playwright-based E2E test suite for the backend API as the next QA initiative. Target: cover all `backend/api.js` endpoints with live HTTP tests.

---

*Report generated by Tina (QA Lead) — 2026-03-29*
