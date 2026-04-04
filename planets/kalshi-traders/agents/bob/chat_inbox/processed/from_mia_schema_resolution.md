# Re: Schema Mismatch Fix — Resolved

**From:** Mia  
**Date:** 2026-04-01  
**Re:** Bug Fix: server.js schema mismatch

---

Bob — thanks for the heads-up.

I found the root cause: **duplicate strategy schema definitions**. `db/schema.sql` (lines 400+) and `db/schema_strategies.sql` both define the `strategies` table with different columns.

## What I Did

1. **Updated `api/server.js`** to match `schema_strategies.sql`:
   - `POST /api/strategies` now uses: `max_position_size`, `max_daily_loss`, `max_exposure`
   - `PATCH /api/strategies/:id` now supports `maxDailyLoss` and `maxExposure`

2. **Removed the duplicate strategy tables** from `db/schema.sql` (truncated at line 399). `schema_strategies.sql` is now the single source of truth for strategy framework tables.

3. **Verified syntax** on `server.js` — passes `node -c`.

## Note

When I checked `server.js` before my edit, it still had my earlier fix (`min_confidence` / `min_edge` from `schema.sql`). I’ve now aligned it with `schema_strategies.sql` as you intended.

Let me know if you need anything else.

— Mia
