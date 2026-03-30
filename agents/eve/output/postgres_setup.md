# PostgreSQL 15 — Tokenfly Provisioning Guide

**Owner:** Eve (Infra Engineer)
**Date:** 2026-03-29
**Covers:** Local Docker-based PostgreSQL 15+ for development and CI
**Schema:** `agents/pat/output/tokenfly_core_schema.sql`

---

## Quick Start (3 steps)

```bash
# 1. Start PostgreSQL
docker compose -f agents/eve/output/docker-compose.postgres.yml up -d

# 2. Apply Pat's schema
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/tokenfly_core_schema.sql

# 3. Verify
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly -c "\dt"
```

Expected output from step 3: 8 tables (`agents`, `tasks`, `task_comments`, `sessions`, `messages`, `announcements`, `company_mode_log`, `audit_log`).

---

## Connection Details

| Parameter | Value |
|-----------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `tokenfly` |
| Username | `tokenfly` |
| Password | `tokenfly_dev` |
| SSL | off (local dev only) |

**Connection String:**
```
postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly
```

**Environment variable pattern** (add to `.env` or `docker-compose.yml` `environment:`):
```
DATABASE_URL=postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly
PGHOST=localhost
PGPORT=5432
PGDATABASE=tokenfly
PGUSER=tokenfly
PGPASSWORD=tokenfly_dev
```

> **Security note:** These credentials are for local dev only. Production credentials must be stored in a secrets vault (never hardcoded). Rotate before any staging/prod deployment.

---

## docker-compose.postgres.yml

See `agents/eve/output/docker-compose.postgres.yml` for the compose file.

Run standalone:
```bash
docker compose -f agents/eve/output/docker-compose.postgres.yml up -d
```

Stop and keep data:
```bash
docker compose -f agents/eve/output/docker-compose.postgres.yml down
```

Stop and **wipe data** (clean slate):
```bash
docker compose -f agents/eve/output/docker-compose.postgres.yml down -v
```

---

## Applying Pat's Schema

The schema at `agents/pat/output/tokenfly_core_schema.sql` requires PostgreSQL 15+ (uses `gen_random_uuid()` from `pgcrypto`, and ENUM types).

### First-time apply
```bash
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/tokenfly_core_schema.sql
```

### Re-apply on clean DB
```bash
# Drop and recreate DB, then re-apply schema
docker exec tokenfly-postgres psql -U tokenfly -d postgres \
  -c "DROP DATABASE IF EXISTS tokenfly; CREATE DATABASE tokenfly;"
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/tokenfly_core_schema.sql
```

### Verify tables and seed data
```bash
# List tables
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly -c "\dt"

# Check agents seed (should show 20 rows)
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  -c "SELECT name, role, department FROM agents ORDER BY name;"
```

---

## Schema Compatibility: Verified ✅

Pat's schema (`tokenfly_core_schema.sql`) has been reviewed against PostgreSQL 15 compatibility:

| Feature | Status |
|---------|--------|
| `pgcrypto` extension | ✅ Built into PostgreSQL 15 |
| ENUM types (`agent_role`, `agent_status`, etc.) | ✅ Valid syntax |
| `gen_random_uuid()` | ✅ Available via pgcrypto |
| TIMESTAMPTZ columns | ✅ Supported |
| GIN index on JSONB | ✅ Supported |
| Conditional indexes (`WHERE ...`) | ✅ Supported |
| `ON CONFLICT (name) DO NOTHING` | ✅ Valid |
| Self-referential FK (`reports_to_id`) | ✅ Handled with deferred SET NULL |
| `BEFORE UPDATE` triggers | ✅ Supported |
| Seed INSERT with 20 agents | ✅ Valid |

**No schema changes needed.** Pat's schema runs as-is on PostgreSQL 15.

---

## Integration with Quinn's docker-compose

Quinn's `agents/quinn/output/docker_setup/docker-compose.yml` runs the Tokenfly app server. To run both:

```bash
# Option A: run postgres separately (recommended during dev)
docker compose -f agents/eve/output/docker-compose.postgres.yml up -d

# Option B: extend Quinn's compose with a postgres service
# Merge the postgres service definition into docker-compose.yml
# and add `depends_on: [postgres]` to the tokenfly service
```

For production, Quinn should add the `postgres` service and `DATABASE_URL` env var to the app compose file. Coordinate with Quinn on Task #49 merge.

---

## Migrations

Pat owns the migration workflow. Eve provides the running instance. When Pat writes migration files:

```bash
# Run a migration file
docker exec -i tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  < agents/pat/output/<migration_file>.sql
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `connection refused` on port 5432 | `docker ps` — check container is running |
| `FATAL: password authentication failed` | Verify `PGPASSWORD=tokenfly_dev` |
| `ERROR: extension "pgcrypto" does not exist` | Container is not PostgreSQL 15+. Re-pull: `docker pull postgres:15` |
| `ERROR: type "agent_role" already exists` | Schema already applied. Drop DB first for clean apply. |
| Container exits immediately | `docker logs tokenfly-postgres` for details |

---

## Health Check

```bash
# Quick ping — returns PostgreSQL version
docker exec tokenfly-postgres psql -U tokenfly -d tokenfly -c "SELECT version();"

# Connection count
docker exec tokenfly-postgres \
  psql -U tokenfly -d tokenfly \
  -c "SELECT count(*) FROM pg_stat_activity WHERE datname='tokenfly';"
```
