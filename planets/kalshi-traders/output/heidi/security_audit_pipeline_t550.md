# Security Audit: Pipeline Scripts — T550

**Auditor:** Heidi (Security Engineer)  
**Date:** 2026-04-03  
**Scope:** Pipeline scripts, API endpoints, data handling, injection surface, credential management  
**Verdict:** CONDITIONAL PASS (2 HIGH, 3 MEDIUM, 2 LOW findings)

---

## Files Audited

| File | Type | Lines |
|------|------|-------|
| `output/bob/run_pipeline.js` | E2E pipeline (Phases 1-4) | 673 |
| `output/shared/codebase/backend/strategies/live_runner.js` | Live strategy runner | 547 |
| `output/shared/codebase/backend/dashboard_api.js` | Dashboard API (Express) | ~900 |
| `output/shared/codebase/backend/api/server.js` | Trading API server | ~800 |
| `output/shared/codebase/backend/kalshi_client.js` | Kalshi API client | 554 |
| `output/shared/codebase/backend/login.js` | Auth/JWT module | 682 |
| `output/shared/codebase/backend/scripts/live_trading_prep.sh` | Go-live gate script | 475 |
| `output/shared/codebase/backend/dashboard/run_scheduler.sh` | Pipeline scheduler | 22 |

---

## Findings

### SEC-001 [HIGH] — Auth bypass in dev mode (dashboard_api.js:144)

```javascript
function requireAuth(req, res, next) {
  if (!API_KEY) return next(); // no key configured = open (dev mode)
  ...
}
```

**Risk:** If `DASHBOARD_API_KEY` env var is not set, ALL authenticated endpoints (including `/api/run-pipeline`, `/api/run`, `/api/kalshi/configure`) are fully open. An attacker on the same network can trigger pipeline execution and inject API credentials.

**Impact:** HIGH — Unauthenticated pipeline trigger + credential injection  
**Likelihood:** HIGH in dev/staging, MEDIUM in production  
**Recommendation:** Require auth always. If no key configured, refuse to start or generate a random key and log it. Never default to open.

---

### SEC-002 [HIGH] — Notification endpoint unauthenticated (dashboard_api.js:696)

```javascript
app.post("/api/notifications/register", (req, res) => {
```

**Risk:** No `requireAuth` middleware on device token registration. Any caller can register arbitrary push tokens. Combined with `/api/notifications/tokens` (also unauthenticated), this leaks registered user IDs and partial tokens.

**Impact:** HIGH — Device token spoofing, user enumeration  
**Recommendation:** Add `requireAuth` to both notification endpoints.

---

### SEC-003 [MEDIUM] — API key accepted via query string (dashboard_api.js:145)

```javascript
const key = req.headers['x-api-key'] || req.query.api_key;
```

**Risk:** API keys in query strings are logged in server access logs, browser history, proxy logs, and Referer headers. This exposes credentials in multiple attack surfaces.

**Recommendation:** Remove `req.query.api_key` — accept keys only via `X-API-Key` header or `Authorization: Bearer`.

---

### SEC-004 [MEDIUM] — Process env credential injection (dashboard_api.js:790)

```javascript
process.env.KALSHI_API_KEY = apiKey;
process.env.KALSHI_DEMO = demo ? "true" : "false";
```

**Risk:** The `/api/kalshi/configure` endpoint sets credentials directly on `process.env`. If auth is bypassed (SEC-001), any caller can inject arbitrary Kalshi API credentials, potentially pointing the system at a malicious API or using stolen keys. Additionally, credentials set this way persist for the entire process lifetime and may leak into child processes.

**Recommendation:** Store credentials in a dedicated config object, not `process.env`. Add additional validation (key format, length). Log credential changes as security events.

---

### SEC-005 [MEDIUM] — CORS allows null origin (dashboard_api.js:101)

```javascript
if (!origin) return callback(null, true);
```

**Risk:** Requests with no `Origin` header are allowed. While this enables `curl` and mobile apps, it also allows sandboxed iframes (`Origin: null`) to bypass CORS restrictions. Combined with SEC-001, this enables cross-origin attacks.

**Recommendation:** In production, require explicit origin or use a separate auth mechanism for non-browser clients. Consider `credentials: false` for no-origin requests.

---

### SEC-006 [LOW] — Login module seeds default passwords (login.js:292-302)

```javascript
const hash = await hashPassword("changeme");
mockDb.users.set(agent.name, { ... password_hash: hash ... });
```

**Risk:** All mock users (alice, bob, charlie, dave, heidi) have password "changeme". These run at module load time unconditionally. If login.js is deployed to production, these accounts are immediately exploitable.

**Recommendation:** Only seed mock users when `NODE_ENV !== 'production'`. Add a startup check that warns if default passwords are active.

---

### SEC-007 [LOW] — Unvalidated `--execute` flag in live_runner.js (line 34)

```javascript
const EXECUTE_TRADES = process.argv.includes("--execute");
```

**Risk:** Any process that can spawn `live_runner.js` with `--execute` triggers real trade execution (when not in paper mode). The `run_scheduler.sh` does not pass `--execute`, but the dashboard API endpoints at `/api/run-pipeline` and `/api/run` execute the script without explicit paper mode enforcement.

**Recommendation:** Verify that spawned instances always have `PAPER_TRADING=true` in the environment unless explicitly authorized. Add a second confirmation flag for live mode.

---

## Positive Findings (PASS)

| Area | Status | Notes |
|------|--------|-------|
| SQL Injection | PASS | All queries in `server.js` use parameterized queries (`$1`, `$2`) |
| Command Injection | PASS | `dashboard_api.js` uses `execFile()` with hardcoded path, not `exec()` with string interpolation |
| XSS via data files | PASS | Pipeline outputs are JSON-only, no HTML injection surface |
| JWT implementation | PASS | `login.js` uses `crypto.timingSafeEqual()`, proper HMAC, short expiry |
| Password handling | PASS | Uses scrypt with random salt, timing-safe comparison |
| Rate limiting | PASS | Login (10/min/IP) and dashboard (100/min/IP) rate limits present |
| Path traversal | PASS | All file paths use `path.join()` with hardcoded constants, no user input in paths |
| Kalshi client | PASS | Defaults to demo mode, requires explicit API key, has rate limiting |
| Paper trading guard | PASS | `PAPER_TRADING` defaults to `true`, requires explicit `false` to enable live |
| Session management | PASS | JTI-based session tracking, revocation support, refresh token rotation |
| CSRF protection | PASS | Double-submit cookie pattern implemented in login.js |

---

## Risk Summary

| Severity | Count | Action Required |
|----------|-------|-----------------|
| CRITICAL | 0 | - |
| HIGH | 2 | Fix before production |
| MEDIUM | 3 | Fix before production |
| LOW | 2 | Fix before go-live |

**Overall Assessment:** The pipeline code is well-structured with good security fundamentals (parameterized SQL, execFile over exec, paper trading safeguards, proper JWT). The main gaps are in the dashboard API authentication layer — SEC-001 and SEC-002 must be fixed before any production deployment. These were flagged in my previous review of `dashboard_api.js` (DASH-001) and remain unresolved.

---

## Recommendations Priority

1. **SEC-001** — Remove dev-mode auth bypass (HIGH, quick fix)
2. **SEC-002** — Add auth to notification endpoints (HIGH, quick fix)
3. **SEC-003** — Remove query string API key support (MEDIUM)
4. **SEC-004** — Isolate credential storage from process.env (MEDIUM)
5. **SEC-005** — Tighten CORS null origin handling (MEDIUM)
6. **SEC-006** — Gate mock user seeding behind NODE_ENV (LOW)
7. **SEC-007** — Enforce paper mode in spawned processes (LOW)
