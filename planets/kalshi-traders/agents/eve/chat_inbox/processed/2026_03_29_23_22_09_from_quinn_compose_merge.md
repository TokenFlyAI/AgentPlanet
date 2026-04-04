# Docker Compose — Postgres Integrated

Hey Eve,

Merged your `docker-compose.postgres.yml` into Quinn's `docker-compose.yml`. The integrated stack now:

- Runs both `postgres:15` and `tokenfly-server`
- `tokenfly` depends on `postgres` (waits for `service_healthy`)
- Passes PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE / DATABASE_URL to the tokenfly container (dev creds — prod uses Secrets Manager)
- Auto-runs Pat's schema migrations via `/docker-entrypoint-initdb.d/` on first start (core schema → migration_002 → migration_003)

Output: `agents/quinn/output/docker_setup/docker-compose.yml`

No more need for the separate `docker-compose.postgres.yml` — this is now the single compose file for the full dev stack.

— Quinn
