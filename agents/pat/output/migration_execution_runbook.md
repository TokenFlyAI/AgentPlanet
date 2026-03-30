# Migration Execution Runbook — Tokenfly Database

**Author**: Pat (Database Engineer)
**Date**: 2026-03-30
**Status**: Ready to execute — pending Alice sign-off
**PostgreSQL**: 15+ provisioned by Eve via docker-compose

---

## Prerequisites

- [ ] Alice sign-off received
- [ ] Docker installed and running
- [ ] Quinn's docker-compose or Eve's standalone compose available

---

## Option A — Full Dev Stack (Recommended)

Uses Quinn's integrated docker-compose. Brings up PostgreSQL + tokenfly server together.
Migrations auto-apply on fresh volume via init scripts.

```bash
cd agents/quinn/output/docker_setup
docker compose up
```

**What happens automatically:**
1. PostgreSQL 15 starts
2. Init scripts execute in order:
   - `01_core_schema.sql` → 9 tables, 6 enums, triggers, indexes
   - `02_request_metrics.sql` → request_metrics table (AgentMetrics persistence)
   - `03_assignee_uuid_fk.sql` → assignee UUID backfill (runs safely, no-op if no tasks)
3. tokenfly-server starts and connects

**Verify schema:**
```bash
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly -c "\dt"
# Expected: agents, tasks, task_comments, sessions, messages,
#           announcements, company_mode_log, audit_log, request_metrics
```

---

## Option B — PostgreSQL Standalone (Eve's compose)

```bash
docker compose -f agents/eve/output/docker-compose.postgres.yml up -d
```

Then apply migrations manually in order:

```bash
# Migration 1: Core schema
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/tokenfly_core_schema.sql

# Migration 2: Request metrics table
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/migration_002_add_request_metrics.sql

# Migration 3: Assignee UUID backfill (run after tasks are imported)
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/migration_003_assignee_uuid_fk.sql
```

**Connection string:**
```
postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly
```

---

## Verification Checklist

After execution, confirm:

```bash
# 1. All 9 tables present
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly -c "\dt"

# 2. All 6 enums defined
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly -c "\dT"

# 3. Triggers active
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly \
  -c "SELECT trigger_name, event_object_table FROM information_schema.triggers;"

# 4. Indexes created
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly -c "\di"

# 5. Request_metrics table present (migration_002)
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly \
  -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'request_metrics';"

# 6. Quick insert test (smoke test)
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly -c "
INSERT INTO agents (name, role, status) VALUES ('test_agent', 'test', 'idle')
  ON CONFLICT (name) DO NOTHING;
SELECT name, role, status FROM agents WHERE name = 'test_agent';
DELETE FROM agents WHERE name = 'test_agent';
"
```

---

## Rollback Procedures

### Rollback migration_003 (assignee UUID FK)
```sql
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id CASCADE;
```

### Rollback migration_002 (request_metrics)
```sql
DROP TABLE IF EXISTS request_metrics;
```

### Full reset (development only)
```bash
docker compose down -v  # Destroys volume
docker compose up       # Fresh schema on restart
```

---

## Post-Execution: Bob Integration

Once schema is live, Bob needs to wire AgentMetrics → request_metrics:

```javascript
// In agent_metrics_api.js recordRequest():
await db.query(
  `INSERT INTO request_metrics (method, endpoint, status_code, duration_ms)
   VALUES ($1, $2, $3, $4)`,
  [method, endpoint, statusCode, durationMs]
);
```

Connection string: `postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly`

See `migration_002_add_request_metrics.sql` for full table schema and Bob integration notes.

---

## RACI

| Step | Responsible | Accountable | Consulted | Informed |
|------|-------------|-------------|-----------|----------|
| Sign-off | Alice | Alice | Olivia | Pat |
| Execute migrations | Pat / DevOps | Alice | Eve | Bob, Quinn |
| Bob metrics integration | Bob | Alice | Pat | Sam |
| Verify & monitor | Pat | Alice | Olivia | Team |
