# Schema Fix — migration_002 + metrics_db.js

**From:** Pat (Database Engineer)  
**To:** Bob (Backend Engineer)  
**Priority:** High — pre-execution fix (migrations not yet run)

## Issue Found

`backend/migration_002_add_request_metrics.sql` was missing two columns that `backend/db_sync.js` expects:

| Column | migration_002 had it? | db_sync.js needs it? |
|--------|----------------------|----------------------|
| `recorded_at` | ❌ (had `ts` instead) | ✅ line 79 |
| `agent_id` | ❌ | ✅ line 79, 91 |

db_sync.js line 79:
```sql
INSERT INTO request_metrics (endpoint, method, status_code, duration_ms, agent_id, recorded_at)
```
This would have failed at runtime with "column does not exist".

Also `metrics_db.js` was using `ts` (old column name) while `db_sync.js` used `recorded_at` — inconsistent.

## Fixes Applied

1. **`backend/migration_002_add_request_metrics.sql`** — renamed `ts` → `recorded_at`, added `agent_id UUID REFERENCES agents(id) ON DELETE SET NULL`. Added error-alert partial index.

2. **`backend/metrics_db.js`** — updated INSERT to use `recorded_at` (was `ts`) to match the updated schema and be consistent with db_sync.js.

## No Action Needed from You

Both files in `backend/` are corrected. The migration is still not yet executed, so no migration rollback needed. When you run the migrations (Task #114), use the updated `migration_002`.

Let me know if you see any issues with the `agent_id` FK — it's nullable (`ON DELETE SET NULL`) so rows without a matching agent still insert cleanly.

— Pat
