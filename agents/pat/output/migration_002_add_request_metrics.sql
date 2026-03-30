-- =============================================================================
-- Migration 002: Add request_metrics table
-- Designer: Pat (Database Engineer)
-- Date: 2026-03-29
-- Depends on: migration_001 (tokenfly_core_schema.sql)
-- =============================================================================
-- Purpose: Persist Bob's in-memory AgentMetrics data to the database.
--          Allows cross-restart analytics and long-term performance trending.
-- Rollback: See end of file (DROP TABLE request_metrics).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FORWARD MIGRATION
-- ---------------------------------------------------------------------------

CREATE TABLE request_metrics (
    id          BIGSERIAL   PRIMARY KEY,
    endpoint    TEXT        NOT NULL,       -- e.g. 'GET /api/tasks'
    method      TEXT        NOT NULL,       -- HTTP method
    status_code SMALLINT    NOT NULL,
    duration_ms INTEGER     NOT NULL,
    client_ip   INET,                       -- NULL if not available (internal calls)
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT request_metrics_endpoint_nonempty  CHECK (char_length(trim(endpoint)) > 0),
    CONSTRAINT request_metrics_method_nonempty    CHECK (char_length(trim(method)) > 0),
    CONSTRAINT request_metrics_duration_positive  CHECK (duration_ms >= 0),
    CONSTRAINT request_metrics_status_valid       CHECK (status_code BETWEEN 100 AND 599)
);

-- Query patterns:
--   1. Recent errors:   WHERE status_code >= 400 ORDER BY recorded_at DESC
--   2. Slow endpoints:  GROUP BY endpoint ORDER BY avg(duration_ms) DESC
--   3. Endpoint volume: GROUP BY endpoint, date_trunc('hour', recorded_at)

CREATE INDEX idx_request_metrics_endpoint_time
    ON request_metrics (endpoint, recorded_at DESC);

CREATE INDEX idx_request_metrics_recent
    ON request_metrics (recorded_at DESC);

-- Partial index: filter to errors only (common alerting query)
CREATE INDEX idx_request_metrics_errors
    ON request_metrics (recorded_at DESC)
    WHERE status_code >= 400;

-- ---------------------------------------------------------------------------
-- OPTIONAL: Partition by month for high-volume deployments
-- (Enable only if request volume exceeds ~10M rows/month)
-- ---------------------------------------------------------------------------
-- This table is NOT partitioned by default. If volume requires it, convert to:
--   CREATE TABLE request_metrics (...) PARTITION BY RANGE (recorded_at);
-- and create monthly partitions. Coordinate with Eve (Infra) before enabling.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- To reverse this migration:
--
--   DROP TABLE IF EXISTS request_metrics;
--
-- No data loss to other tables — this is an isolated new table.

-- ---------------------------------------------------------------------------
-- INTEGRATION NOTE for Bob / Dave
-- ---------------------------------------------------------------------------
-- To use this table from AgentMetrics.recordRequest(), add a DB write call:
--
--   INSERT INTO request_metrics (endpoint, method, status_code, duration_ms, client_ip)
--   VALUES ($1, $2, $3, $4, $5);
--
-- The existing in-memory store can remain as a fast read path (cache),
-- with this table as the durable write path.
--
-- Suggested batch insert pattern to avoid per-request DB round-trips:
--   Buffer writes in AgentMetrics._pendingWrites[]
--   Flush to DB every 5 seconds via setInterval
--   Flush on process SIGTERM
