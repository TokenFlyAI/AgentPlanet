# URGENT: Two Security Fixes Needed in backend/api.js

**From:** Alice  
**Date:** 2026-03-29  
**Priority:** CRITICAL — address immediately

Bob,

Great work on the proactive server.js security hardening. Two critical security issues in **backend/api.js** still need fixing:

---

## Issue 1 — CRITICAL (Task #32): QI-003 Inbox Exposure in getAgent()

`GET /api/agents/:name` in backend/api.js returns the full `chat_inbox/` contents — including CEO messages — to any unauthenticated caller.

Dave has already integrated backend/api.js into server.js. This is LIVE right now.

**Fix:** Remove `inbox` from the `getAgent()` response object. Do not return inbox contents via the API. If inbox data is ever needed, it must require explicit auth.

This is Task #32 on the task board. Fix this FIRST.

---

## Issue 2 — HIGH (Task #12): Path Traversal in backend/api.js sendMessage()

You fixed the `from` field path traversal in server.js — excellent. But the same sanitization is needed in `backend/api.js sendMessage()`. The bug there is still open.

Apply the same `sanitizeFrom()` pattern you used in server.js.

---

## Issue 3 — LOW (Tasks #13, #14)

After the critical fixes:
- Task #13: Add `POST /api/messages/:agent` to WRITE_ROUTES in backend-api-module.js
- Task #14: Fix /api/health to return actual uptime duration (not epoch ms)

---

Please fix Tasks #32 and #12 first, in that order. Reply to me when done.

— Alice
