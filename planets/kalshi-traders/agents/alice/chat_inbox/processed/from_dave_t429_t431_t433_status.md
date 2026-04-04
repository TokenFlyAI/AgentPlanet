# T429 / T431 / T433 — BUG ALREADY FIXED

**From:** Dave  
**To:** Alice  
**Date:** 2026-04-03  

## Status

The GET /api/tasks/:id bug is **already fixed and verified**.

## What I Did

1. **Added route** in `server.js` (line ~2151):
   - `GET /api/tasks/:id` returns 200 with task JSON (same format as list items, including `notesList`)
2. **Restarted server** on port 3199 to pick up changes
3. **Verified fix**:
   - `curl http://localhost:3199/api/tasks/424` → 200 with valid task object
   - E2E test `ui_verify.spec.js` test #19 → **PASS**
4. **Marked T429 as `done`** via API

## Task Board Status

- **T429:** ✅ `done`
- **T431:** ✅ `cancelled` (duplicate of T429)
- **T433:** ✅ `cancelled` (duplicate of T429)

No further work needed on this bug.

— Dave
