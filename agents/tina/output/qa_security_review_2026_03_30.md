# QA Security Review — Heidi's Audit (Task #17)
**QA Lead:** Tina
**Date:** 2026-03-30
**Source Audit:** agents/heidi/output/security_audit_backend.md
**Related Task:** #17 (Security Audit), #104 (Alice to review and assign fixes)

---

## QA Verdict: AUDIT APPROVED — HIGH QUALITY, BLOCKING FINDINGS

Heidi's security audit is thorough, well-evidenced with reproduction steps, and covers the right attack surface. All 7 findings are legitimate. The audit should be acted upon before any production deployment.

---

## Findings Summary

| ID | Severity | Title | QA Assessment |
|----|----------|-------|---------------|
| SEC-001 | **CRITICAL** | No Authentication/Authorization | ✅ Confirmed. Every mutating endpoint is open. Blocks prod. |
| SEC-002 | HIGH | X-Forwarded-For IP Spoofing | ✅ Confirmed. Rate limiter is bypassable. Fix is 1-hour effort. |
| SEC-003 | MEDIUM | Task Board Pipe Injection | ✅ Confirmed. Can corrupt task board data. |
| SEC-004 | MEDIUM | CEO Command Impersonation | ✅ Confirmed. Addressed by SEC-001 fix. |
| SEC-005 | MEDIUM | Agent Status Disclosure | ✅ Confirmed. status_md content exposed. |
| SEC-006 | LOW | Permissive CORS | ✅ Confirmed. Low priority but easy fix. |
| SEC-007 | LOW | In-Memory Rate Limiter | ✅ Confirmed. Acceptable for internal tool. Document. |

---

## Recommended Fix Priority (QA View)

### P0 — Required Before Deployment
1. **SEC-001** — API key auth on all mutating endpoints (POST/PATCH/DELETE)
   - Estimated effort: 1-2 days (Bob or Dave)
   - Blocks: production deployment, any external exposure
   - Test: Add auth e2e tests to `e2e/api.spec.js` (5-10 new tests)

2. **SEC-002** — Trusted proxy config for X-Forwarded-For
   - Estimated effort: 2 hours
   - Assign: Bob (owns backend-api-module.js)

### P1 — Fix in Next Sprint
3. **SEC-003** — Pipe char escaping in task board serialization
   - Estimated effort: 1 hour
   - Assign: Bob or Dave

4. **SEC-005** — Restrict status_md to authenticated requests
   - Estimated effort: 1 hour
   - Assign: Bob (server.js)

### P2 — Hygiene
5. **SEC-006** — Restrict CORS origin
   - Estimated effort: 30 minutes
   - Assign: whoever touches server.js first

6. **SEC-007** — Document rate limiter limitation in README
   - Estimated effort: 10 minutes

---

## Positive Findings (QA Validated)

Heidi's positive findings are accurate. The following are correctly implemented:
- Agent name allowlist regex (prevents path traversal) — ✅ verified in server.js
- `sanitizeFrom()` filename injection prevention — ✅ verified
- Body size 512KB cap — ✅ verified
- `execFile` array args (no shell injection) — ✅ verified
- Task board advisory lock — ✅ verified
- Sliding window rate limiter — ✅ verified (when not bypassed)
- Validator.validate() schemas — ✅ verified

---

## Impact on E2E Tests

When SEC-001 (auth) is implemented:
- All e2e tests will need `Authorization: Bearer <key>` headers on POST/PATCH/DELETE calls
- Estimate: 30-40 test updates across `api.spec.js`, `dashboard.spec.js`, `metrics.spec.js`
- **Tina will update e2e tests after auth implementation is complete**

---

## Actions Taken
- [x] Task #17 marked DONE on task_board.md
- [x] Alice notified (see alice/chat_inbox)
- [ ] Awaiting Alice to create and assign SEC-001 fix tasks (Task #104)

---

*QA sign-off: Tina — 2026-03-30*
