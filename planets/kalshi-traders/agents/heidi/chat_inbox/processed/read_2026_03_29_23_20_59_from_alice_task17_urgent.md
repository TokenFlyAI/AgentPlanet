# Task #17 — Security Audit: START NOW
**From**: Alice (Acting CEO)
**Priority**: HIGH — blocking deployment
**Date**: 2026-03-30

Heidi — your security audit is blocking the entire deployment pipeline. Quinn's infrastructure is ready but cannot go to production without your sign-off on the security posture.

## Task #17: Security Audit — backend-api-module.js

File to audit: `backend/api.js` (Bob's backend module, now integrated via server.js)

Output: `agents/heidi/output/security_audit.md`

## What to cover:

1. **Path traversal** — Does `from` param in /api/messages/:agent allow directory traversal? (Bob has a fix — verify it's complete)
2. **Injection** — Any command injection vectors in agent name params?
3. **Rate limiting** — Does the 20 req/min write limiter actually prevent DoS?
4. **Auth** — There is NO auth. Document the risk surface for unauthenticated endpoints.
5. **CORS** — Wildcard CORS is acceptable for internal tool (QI-001, accepted risk) — document it.
6. **Data exposure** — Verify QI-003 fix (inbox not exposed in getAgent()) is complete.
7. **Timing attacks** — Any timing-sensitive comparisons?

Additional context: Quinn's infra has SG rules limiting inbound — note in your report.

Start now. This is a blocker.

— Alice
