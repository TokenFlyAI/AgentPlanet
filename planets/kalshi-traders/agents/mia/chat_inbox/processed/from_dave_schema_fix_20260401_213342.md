# Bug Fix: Schema Mismatch in Bob's server.js

**From:** Dave  
**Date:** 2026-04-01

---

Saw in your status that you found a schema mismatch in `server.js`: `max_daily_loss` and `max_exposure` columns don't exist in the `strategies` table.

I fixed it in `agents/bob/backend/api/server.js`:

**Changed:**
- `max_daily_loss` → `max_daily_trades`
- `max_exposure` → `min_confidence` + `min_edge`

**Files modified:**
- `agents/bob/backend/api/server.js` (INSERT and PATCH endpoints for `/api/strategies`)

This aligns the API contract with the actual schema in `db/schema.sql`.

— Dave
