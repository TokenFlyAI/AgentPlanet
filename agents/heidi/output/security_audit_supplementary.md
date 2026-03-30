# Security Audit — Supplementary Findings (Cycle 9)
**Auditor:** Heidi (Security Engineer)
**Date:** 2026-03-30
**Scope:** New backend files added since initial audit: `backend/agent_metrics_api.js`, `backend/metrics_db.js`, `backend/db_sync.js`
**Status of Prior Findings:** SEC-001 (Task #103, assigned Quinn — in_progress), SEC-002 (Task #104, assigned Bob — open)

---

## New Files Audited

### backend/agent_metrics_api.js

**SEC-010: No authentication on metrics endpoints** — MEDIUM
- All `/api/metrics/*` endpoints are unauthenticated, same root cause as SEC-001.
- Fix: Apply the same `requireApiKey` middleware from `auth_middleware.js`.
- Note: These endpoints expose agent names, statuses, and task counts — information useful for reconnaissance.

**Finding: Agent name path traversal — PASSED**
- `/api/metrics/agents/:name` uses regex `[a-z0-9_-]+` — safe, no traversal possible. ✅

**Finding: File reads use path.join with validated name — PASSED** ✅

---

### backend/metrics_db.js and backend/db_sync.js

**SEC-011: Hardcoded database credentials as default** — LOW
- `const DB_URL = process.env.DATABASE_URL || "postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly"`
- Present in both `metrics_db.js` and `db_sync.js`.
- Risk: If `DATABASE_URL` is not set in production, the hardcoded dev credentials are used. If the DB is externally reachable, credential is exposed.
- Fix: Remove the fallback default. Require `DATABASE_URL` to be explicitly set:
  ```js
  const DB_URL = process.env.DATABASE_URL;
  if (!DB_URL) { console.error("DATABASE_URL env var is required"); process.exit(1); }
  ```

**Finding: SQL injection via parameterized queries — PASSED**
- `db_sync.js` and `metrics_db.js` use `$1, $2, ...` parameterized queries for all INSERT operations. ✅
- No dynamic SQL string concatenation found.

**Finding: JSONL queue path is fixed constant — PASSED**
- `METRICS_QUEUE = path.resolve(__dirname, "metrics_queue.jsonl")` — no user input in path. ✅

**Finding: Race condition in queue drain** — LOW
- `clearQueue()` is called after all inserts succeed. If the process is killed mid-drain, partial rows may be re-inserted on next run, causing duplicate metrics. Not a security issue, but a data integrity note.
- Fix: Use a transaction or offset-based drain rather than delete-after-all.

---

## backend/api.js — Additional Findings (from this session's full read)

**SEC-012: CORS wildcard in production** — MEDIUM
- `"Access-Control-Allow-Origin": "*"` on all JSON responses including mutation endpoints (POST/PATCH/DELETE).
- Once SEC-001 auth is added, CORS wildcard is lower risk (key still required), but cross-origin state-changing requests without CSRF protection remain a concern.
- Fix: In production, set `ALLOWED_ORIGINS` env var and reflect only that origin. For same-origin dashboard use, set `Access-Control-Allow-Origin` to the specific frontend origin.

**Finding: Task description/title not HTML-sanitized** — INFO
- Task content is stored in a markdown file and returned as JSON strings. Since the dashboard renders it, XSS risk depends on whether the frontend escapes output.
- Recommend: Verify `index_lite.html` uses `textContent` not `innerHTML` for task data.

---

## Reference Implementations Delivered

| File | Purpose | For |
|------|---------|-----|
| `output/auth_middleware.js` | Drop-in API key auth for server.js + backend/api.js | Quinn (Task #103) |
| `output/trusted_proxy_fix.js` | Trusted proxy check for rate limiter; includes self-tests | Bob (Task #104) |

---

## Summary

| ID | Severity | Status | Fix Owner |
|----|----------|--------|-----------|
| SEC-001 | P0 Critical | In Progress | Quinn (#103) |
| SEC-002 | High | Open | Bob (#104) |
| SEC-010 | Medium | New | Quinn (extend #103) |
| SEC-011 | Low | New | Bob |
| SEC-012 | Medium | New | Bob |

**Deployment Blocker**: SEC-001 must be resolved and verified before production deploy. SEC-010 should be bundled into the same fix pass (same auth middleware, one extra `require`).

---

## Verification Protocol for Heidi

When SEC-001 fix (Task #103) is delivered:
1. Confirm `requireApiKey` (or equivalent) is called BEFORE all route handlers in both `server.js` and `backend/api.js`.
2. Test: `curl http://localhost:3199/api/agents` → must return `401`.
3. Test: `curl -H "X-API-Key: wrongkey" http://localhost:3199/api/agents` → must return `401`.
4. Test: `curl -H "X-API-Key: $API_KEY" http://localhost:3199/api/agents` → must return `200`.
5. Test: `curl http://localhost:3199/api/health` → must return `200` (exempt path).
6. Confirm timing-safe comparison used (no `===` on key strings in hot path).
7. Confirm key is sourced from env, not hardcoded.
