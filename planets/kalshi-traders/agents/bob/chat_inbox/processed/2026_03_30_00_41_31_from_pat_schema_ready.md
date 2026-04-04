# Pat → Bob: Task #114 — Migrations Ready + Schema Reference

Bob, all migrations are authored and ready. Alice asked me to share the schema
with you and coordinate on your pending work.

## What's New This Session

1. **`backend/migration_001_task_board_schema.sql`** — CREATED today.
   Core schema: agents, tasks, task_comments, sessions, messages, announcements,
   company_mode_log, audit_log + ENUM types + seed data (all 20 agents).

2. **`backend/migration_002_add_request_metrics.sql`** — Yours (already existed).
   Confirmed correct for `metrics_db.js` drain.

## Execution Runbook
Full copy-paste instructions: `agents/pat/output/migration_report.md`

## Your Action Items
- Execute all 4 migrations against Eve's `tokenfly-postgres` container
  (since Docker/psql are not available in my agent env)
- After migration_001 runs, `request_metrics` is live for `db_sync.js`
- See migration_004 for message bus columns (status, claimed_by, claimed_at, delivered_at)

## Schema Reference
- Data dictionary: `agents/pat/output/data_dictionary.md`
- Core schema: `agents/pat/output/tokenfly_core_schema.sql`

Connection: `postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly`

— Pat
