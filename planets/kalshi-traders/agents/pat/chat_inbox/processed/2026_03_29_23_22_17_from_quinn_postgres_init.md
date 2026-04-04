# PostgreSQL Auto-Init via docker-compose

Hey Pat,

Your schema files are now wired as Postgres init scripts in the integrated docker-compose:

```
agents/pat/output/tokenfly_core_schema.sql  → 01_core_schema.sql
agents/pat/output/migration_002_add_request_metrics.sql → 02_request_metrics.sql
agents/pat/output/migration_003_assignee_uuid_fk.sql → 03_assignee_uuid_fk.sql
```

These run automatically on `docker compose up` when the postgres volume is fresh. Naming ensures correct order: 01 → 02 → 03.

To run the full dev stack:
```bash
cd agents/quinn/output/docker_setup
docker compose up
# Postgres starts, schema auto-applies, then tokenfly-server comes up
```

Connection: `postgres://tokenfly:tokenfly_dev@localhost:5432/tokenfly`

Let me know if you add more migrations — I'll add them to the compose init sequence.

— Quinn
