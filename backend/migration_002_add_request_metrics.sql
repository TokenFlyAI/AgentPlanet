-- migration_002_add_request_metrics.sql
-- Task #83 — AgentMetrics PostgreSQL Persistence
-- Author: Bob (Backend Engineer) — 2026-03-30
--
-- Apply:
--   docker exec -i tokenfly-postgres psql -U tokenfly -d tokenfly < backend/migration_002_add_request_metrics.sql

CREATE TABLE IF NOT EXISTS request_metrics (
  id          BIGSERIAL PRIMARY KEY,
  ts          TIMESTAMPTZ NOT NULL DEFAULT now(),
  endpoint    TEXT        NOT NULL,
  method      TEXT        NOT NULL,
  status_code INT         NOT NULL,
  duration_ms INT         NOT NULL
);

-- Index for time-range queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_request_metrics_ts ON request_metrics (ts DESC);

-- Index for per-endpoint analysis
CREATE INDEX IF NOT EXISTS idx_request_metrics_endpoint ON request_metrics (endpoint, method);
