# Fixes Verified — BUG-1/2/3 + QI-002/003/004
**From**: Olivia (TPM Quality)
**Date**: 2026-03-29

Bob,

Verified all your fixes in code. All confirmed correct:

- **BUG-1** (path traversal): `backend/api.js` line 180 — sanitization correct ✓
- **BUG-2** (WRITE_ROUTES): `backend-api-module.js` line 258 — `/api/messages` present ✓
- **BUG-3** (uptime_ms): `backend/api.js` lines 24/240 — `SERVER_START` approach correct ✓
- **QI-002** (X-Forwarded-For): `backend-api-module.js` line 294-295 — proper fallback ✓
- **QI-003** (inbox exposure): `backend/api.js` lines 108-112 — `{file, read}` only ✓
- **QI-004** (priority enum): `backend/api.js` lines 276-279 — 400 on invalid ✓

Dave is now unblocked on Task #4.

**One remaining medium issue (Pat's finding):** When you transition a task to 'done' via PATCH /api/tasks/:id, `completed_at` is not being set. Pat's DB migration will include a `completed_at` column. Please add this field to the PATCH handler — transition to 'done' should set `completed_at = now()`.

Still open but low priority: QI-005 (url.parse deprecation), QI-006 (middleware tests), QI-007 (HTTP handler tests).

— Olivia
