# Tokenfly Agent Team Lab — Database Migration Strategy

**Author**: Pat (Database Engineer)
**Date**: 2026-03-29
**Status**: DRAFT — pending Eve (Infra) PostgreSQL confirmation, Bob enum alignment
**Target DB**: PostgreSQL 15+

---

## 1. Overview

This document defines the full migration strategy for bringing the Tokenfly Agent Team Lab
platform from its current file-based persistence to a durable PostgreSQL database.

The migration is **additive and non-destructive** — existing file-based operations continue
to work in parallel during the transition. The database layer is introduced incrementally,
one domain at a time.

### Guiding Principles

1. **Reversibility** — every migration has a tested rollback.
2. **Zero-downtime** — no migration requires application downtime.
3. **Correctness first** — constraints are added before data, not after.
4. **Incremental** — apply one migration at a time, validate before proceeding.
5. **Pre/post checks** — every migration includes validation queries.

---

## 2. Pre-conditions (Blockers Before Any Migration Runs)

| # | Pre-condition | Owner | Status |
|---|---------------|-------|--------|
| P1 | PostgreSQL 15+ provisioned with `pgcrypto` extension available | Eve (Infra) | **PENDING** |
| P2 | Database connection string configured in app environment | Eve / Bob | **PENDING** |
| P3 | Bob's enum alignment confirmed (`in_review`, `cancelled` support) | Bob | **PENDING** — flagged in alignment report |
| P4 | `completed_at` logic added to PATCH /api/tasks/:id (BUG-1 adjacent) | Bob | **PENDING** — flagged separately |
| P5 | Test database provisioned for migration dry-runs | Eve | **PENDING** |

**Do not run any migration in production until all P1–P5 are resolved.**

---

## 3. Migration Inventory

| Migration | File | Description | Depends On | Status |
|-----------|------|-------------|------------|--------|
| 001 | `tokenfly_core_schema.sql` | Full core schema (all tables, types, indexes, triggers) | — (initial) | Ready for review |
| 002 | `migration_002_add_request_metrics.sql` | Persist Bob's AgentMetrics data | Migration 001 | Ready for review |
| 003 | *(planned)* `migration_003_assignee_uuid.sql` | Migrate `assignee` string → UUID FK | Migration 001 + agent seed data | Planned |

---

## 4. Migration 001 — Core Schema

**File**: `tokenfly_core_schema.sql`
**Type**: Initial schema — creates all tables from scratch
**Risk**: Low (new schema, no existing DB data to lose)

### Tables Created

| Table | Purpose | Key Constraints |
|-------|---------|----------------|
| `agents` | Agent registry | UNIQUE(name), NOT NULL on all fields |
| `tasks` | Task board | FK→agents, CHECK completed_at when done, priority/status ENUMs |
| `task_comments` | Per-task discussion | FK→tasks ON DELETE CASCADE |
| `sessions` | Agent work cycles | FK→agents, ended_at >= started_at |
| `messages` | Inter-agent messages | FK→agents, NOT NULL body, read_at >= created_at |
| `announcements` | Team announcements | NOT NULL title+body, expires_at > created_at |
| `company_mode_log` | Mode switch history | ENUM(plan, normal, crazy) |
| `audit_log` | Immutable action log | JSONB details, append-only by convention |

### ENUM Types Created

```sql
agent_role    — 20 roles matching the team directory
agent_status  — online, offline, idle, blocked, error
task_priority — critical, high, medium, low
task_status   — open, in_progress, blocked, in_review, done, cancelled
company_mode  — plan, normal, crazy
message_sender_type — agent, ceo, system
```

### Execution

```sql
-- Apply (run as DB owner or superuser):
\i tokenfly_core_schema.sql

-- Verify:
\dt
SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';
```

### Post-Migration Validation

```sql
-- All tables exist:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: agents, announcements, audit_log, company_mode_log,
--           messages, request_metrics, sessions, task_comments, tasks

-- All enum types exist:
SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;
-- Expected: agent_role, agent_status, company_mode, message_sender_type,
--           task_priority, task_status

-- Check updated_at trigger exists:
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'set_updated_at%';
```

### Rollback 001

```sql
-- Full rollback (destroys schema entirely):
DROP TABLE IF EXISTS audit_log, company_mode_log, announcements,
    messages, sessions, task_comments, tasks, agents CASCADE;
DROP TYPE IF EXISTS agent_role, agent_status, task_priority, task_status,
    company_mode, message_sender_type;
DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE;
DROP EXTENSION IF EXISTS pgcrypto;
```

---

## 5. Migration 002 — Request Metrics Table

**File**: `migration_002_add_request_metrics.sql`
**Type**: Additive (new isolated table)
**Risk**: Very low (new table, no FK dependencies on existing data)
**Depends on**: Migration 001 must be applied first

### Purpose

Persist Bob's in-memory `AgentMetrics.recordRequest()` data to PostgreSQL for:
- Cross-restart analytics
- Long-term performance trending
- Slow endpoint detection (avg duration_ms by endpoint)
- Error rate monitoring (status_code >= 400 queries)

### Table Created: `request_metrics`

```sql
id          BIGSERIAL PRIMARY KEY
endpoint    TEXT NOT NULL          -- 'GET /api/tasks'
method      TEXT NOT NULL          -- HTTP method
status_code SMALLINT NOT NULL      -- 100–599
duration_ms INTEGER NOT NULL       -- >= 0
client_ip   INET                   -- nullable
recorded_at TIMESTAMPTZ DEFAULT now()
```

### Indexes

| Index | Query Pattern |
|-------|---------------|
| `idx_request_metrics_endpoint_time` | Slow endpoint analysis by endpoint + time |
| `idx_request_metrics_recent` | Dashboard: recent requests |
| `idx_request_metrics_errors` | Partial: errors only (status_code >= 400) |

### Integration Note for Bob / Dave

After applying this migration, integrate the DB write into `AgentMetrics.recordRequest()`:

```js
// Batched write (preferred — avoid per-request DB round-trips):
// 1. Push to this._pendingWrites[] instead of direct insert
// 2. setInterval flush every 5 seconds:
//    INSERT INTO request_metrics (endpoint, method, status_code, duration_ms, client_ip)
//    SELECT * FROM unnest($1::text[], $2::text[], $3::int2[], $4::int4[], $5::inet[])
// 3. Flush on SIGTERM
```

### Execution

```sql
\i migration_002_add_request_metrics.sql

-- Verify:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'request_metrics'
ORDER BY ordinal_position;
```

### Rollback 002

```sql
DROP TABLE IF EXISTS request_metrics;
-- No impact on other tables — isolated table.
```

---

## 6. Migration 003 — Assignee UUID FK (Planned)

**Status**: PLANNED — not yet written
**Depends on**: Migration 001 + seed data (agents table populated)

### Problem

The current task board stores `assignee` as a name string (e.g. `"bob"`, `"tina"`).
The schema uses a UUID FK (`assignee_id → agents.id`).

This migration bridges the gap once the agents table is populated.

### Plan

```sql
-- Step 1: Populate agents table from team directory (seed data)
-- Step 2: Add assignee_name TEXT column to tasks temporarily
ALTER TABLE tasks ADD COLUMN assignee_name TEXT;

-- Step 3: Copy current assignee_id back-resolved to name
-- (skip if starting from scratch with correct UUIDs)

-- Step 4: For any tasks with string names, resolve UUID:
UPDATE tasks t
SET assignee_id = a.id
FROM agents a
WHERE t.assignee_name = a.name
  AND t.assignee_id IS NULL;

-- Step 5: Drop temporary column
ALTER TABLE tasks DROP COLUMN assignee_name;
```

### Rollback 003

```sql
-- assignee_id is nullable — setting it NULL is safe
UPDATE tasks SET assignee_id = NULL;
-- Data loss: assignee assignments lost. Back up before running.
```

---

## 7. Zero-Downtime Strategy

All migrations in this sequence are safe for zero-downtime deployment because:

1. **Migration 001**: Creates new schema — no existing tables modified.
2. **Migration 002**: Adds one isolated table — no existing tables modified.
3. **Migration 003**: Updates a nullable FK column — reads during migration
   see NULL for in-flight rows (acceptable for task board display).

### For Future Migrations Involving Existing Tables

If a future migration must ALTER a high-traffic table:
1. Add new nullable column (online-safe in PostgreSQL).
2. Backfill in batches (1000 rows/batch with pg_sleep(0.1) between).
3. Add NOT NULL constraint with DEFAULT (PostgreSQL 11+ is metadata-only).
4. Drop old column in a follow-up migration after app code deployed.

---

## 8. Seed Data — Agent Registry

Before any application data can be stored, the `agents` table must be seeded.
This is a one-time data load, not a DDL migration.

**Coordination**: Bob or Dave should add this to the app startup sequence.

```sql
-- Seed: 20 agents from team directory
INSERT INTO agents (name, role, department) VALUES
    ('alice',   'acting_ceo',          'Leadership'),
    ('sam',     'tpm',                 'Leadership'),
    ('olivia',  'tpm',                 'Leadership'),
    ('tina',    'qa_lead',             'QA'),
    ('frank',   'qa_engineer',         'QA'),
    ('bob',     'backend',             'Engineering'),
    ('charlie', 'frontend',            'Engineering'),
    ('dave',    'fullstack',           'Engineering'),
    ('eve',     'infra',               'Engineering'),
    ('grace',   'data',                'Engineering'),
    ('heidi',   'security',            'Engineering'),
    ('ivan',    'ml',                  'Engineering'),
    ('judy',    'mobile',              'Engineering'),
    ('karl',    'platform',            'Engineering'),
    ('liam',    'sre',                 'Engineering'),
    ('mia',     'api',                 'Engineering'),
    ('nick',    'performance',         'Engineering'),
    ('pat',     'database',            'Engineering'),
    ('quinn',   'cloud',               'Engineering'),
    ('rosa',    'distributed_systems', 'Engineering')
ON CONFLICT (name) DO NOTHING;

-- Set reporting structure:
UPDATE agents SET reports_to_id = (SELECT id FROM agents WHERE name = 'alice')
WHERE name IN ('sam','olivia','tina','frank','bob','charlie','dave','eve','grace',
               'heidi','ivan','judy','karl','liam','mia','nick','pat','quinn','rosa');
```

---

## 9. Migration Execution Checklist

Use this checklist for every migration run:

```
Pre-flight:
[ ] Confirm PostgreSQL version: SELECT version();
[ ] Confirm pgcrypto available: SELECT * FROM pg_available_extensions WHERE name = 'pgcrypto';
[ ] Backup taken (even in dev — good habit)
[ ] Test run completed on non-production DB
[ ] Rollback script reviewed and tested

Execution:
[ ] Begin transaction (wrap DDL in BEGIN/COMMIT for safety)
[ ] Apply migration SQL
[ ] Run post-migration validation queries
[ ] Confirm row counts / object counts as expected
[ ] Commit

Post-flight:
[ ] Notify Bob (schema changes affecting API data models)
[ ] Notify Dave (if integration layer affected)
[ ] Notify Grace (if table structures for pipelines changed)
[ ] Update task board
```

---

## 10. Open Issues & Alignment Required

| # | Issue | Impact | Owner | Resolution |
|---|-------|--------|-------|------------|
| A1 | Bob's PATCH /api/tasks/:id does NOT set `completed_at` | Schema CHECK will reject updates to `done` status | Bob | Add `completed_at = new Date().toISOString()` when `status = 'done'` |
| A2 | Bob's status enum missing `in_review`, `cancelled` | `task_status` ENUM has them; application rejects them | Bob + Pat | Agree on canonical enum values; align schema OR application |
| A3 | Bob's `agent_metrics_api.js` `byStatus` map excludes `in_review`/`cancelled` | Metrics undercounts task statuses | Bob | Update `byStatus` keys to match task_status ENUM |
| A4 | `assignee` stored as name string in API; schema uses UUID FK | Migration 003 required for full FK enforcement | Pat | Migration 003 planned (after seed data) |
| A5 | PostgreSQL not yet provisioned | No migrations can run | Eve | Awaiting infra confirmation |

---

## 11. Responsibility Matrix

| Activity | Pat | Bob | Dave | Eve | Grace |
|----------|-----|-----|------|-----|-------|
| Schema design | **owns** | review | review | review | review |
| Migration authoring | **owns** | — | — | — | — |
| Migration execution | **owns** | — | — | supports | — |
| DB infrastructure | — | — | — | **owns** | — |
| App layer integration | — | **owns** | supports | — | — |
| Data pipelines alignment | consult | — | — | — | **owns** |

---

## 12. Document History

| Date | Author | Change |
|------|--------|--------|
| 2026-03-29 | Pat | Initial draft |
