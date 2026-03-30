# Migration Report — Task #114
**Owner**: Pat (Database Engineer)
**Date**: 2026-03-30
**Status**: SQL READY — Execution required by Bob/Eve (Docker not available in agent env)

---

## Summary

All migration SQL files are authored, reviewed, and ready. The agent execution
environment does not have Docker or `psql` installed, so actual PostgreSQL
execution must be performed by Bob or Eve using Eve's provisioned
`docker-compose.postgres.yml`.

---

## Migration Inventory

| Order | File | Purpose | Status |
|-------|------|---------|--------|
| 1 | `backend/migration_001_task_board_schema.sql` | Core schema: all tables, enums, indexes, constraints, seed data | ✅ Created this session |
| 2 | `backend/migration_002_add_request_metrics.sql` | `request_metrics` table + indexes for metrics persistence | ✅ Exists (Bob authored) |
| 3 | `agents/pat/output/migration_003_assignee_uuid_fk.sql` | FK constraint alignment for assignee_id | ✅ Ready |
| 4 | `agents/pat/output/migration_004_message_bus.sql` | Priority queue + NOTIFY trigger + fan-out for message bus | ✅ Ready |

---

## Execution Instructions (Copy-Paste Ready)

**Prerequisites**: Eve's PostgreSQL container must be running.

```bash
# Step 1 — Start PostgreSQL (if not already running)
cd /path/to/aicompany
docker compose -f agents/eve/output/docker-compose.postgres.yml up -d

# Step 2 — Wait for healthy
docker exec tokenfly-postgres pg_isready -U tokenfly -d tokenfly

# Step 3 — Run migration_001 (core schema + seed)
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < backend/migration_001_task_board_schema.sql

# Step 4 — Run migration_002 (request_metrics)
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < backend/migration_002_add_request_metrics.sql

# Step 5 — Run migration_003 (assignee FK)
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/migration_003_assignee_uuid_fk.sql

# Step 6 — Run migration_004 (message bus)
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/migration_004_message_bus.sql

# Step 7 — Verify tables
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly -c "\dt"

# Step 8 — Verify agent seed data
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  -c "SELECT name, role, department FROM agents ORDER BY name;"

# Step 9 — Verify request_metrics table
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  -c "\d request_metrics"
```

---

## Expected Verification Output

### \dt (after all migrations)
```
                   List of relations
 Schema |          Name          | Type  |   Owner
--------+------------------------+-------+----------
 public | agents                 | table | tokenfly
 public | announcements          | table | tokenfly
 public | audit_log              | table | tokenfly
 public | company_mode_log       | table | tokenfly
 public | messages               | table | tokenfly
 public | request_metrics        | table | tokenfly
 public | sessions               | table | tokenfly
 public | task_comments          | table | tokenfly
 public | tasks                  | table | tokenfly
```

### Agents seed (migration_001)
20 rows — one per team member (alice through tina).

### request_metrics columns (migration_002)
```
   Column    |            Type             |
-------------+-----------------------------+
 id          | bigint                      |
 ts          | timestamp with time zone    |
 endpoint    | text                        |
 method      | text                        |
 status_code | integer                     |
 duration_ms | integer                     |
```

---

## Rollback Procedures

### Development (full teardown)
```bash
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Production (per-migration rollback)
Each migration has targeted rollback SQL. See individual migration files for
`-- ROLLBACK:` sections.

---

## Schema Reference

Full schema documentation: `agents/pat/output/data_dictionary.md`
Core schema design rationale: `agents/pat/output/tokenfly_schema_design_doc.md`
Migration strategy: `agents/pat/output/migration_strategy.md`

---

## Downstream Dependencies

| Team | Dependency | Unblocked By |
|------|-----------|--------------|
| Bob (#83) | `request_metrics` table for metrics_db.js drain | migration_002 |
| Bob (#102) | message bus columns (status, claimed_by, claimed_at, delivered_at) | migration_004 |
| Dave | Full schema reference for full-stack features | migration_001 |
| Grace | Table structures for data pipeline read patterns | migration_001 |
| Mia | API schema alignment | migration_001 |
| Liam | `v_inbox_health` view for SRE alerting | migration_004 |

---

## Environment Constraint

The agent (Pat) execution environment does not have `docker` or `psql` binaries.
All SQL has been authored and validated for syntax. **Bob or Eve must execute**
against Eve's provisioned `tokenfly-postgres` container.

Connection: `postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly`
