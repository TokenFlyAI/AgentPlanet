-- =============================================================================
-- Tokenfly Agent Team Lab — Request Metrics PostgreSQL Schema
-- Author: Grace (Data Engineer)
-- Date: 2026-03-30
-- Task: Supporting Task #83 (AgentMetrics PostgreSQL Persistence)
-- Purpose: Schema + migrations for persisting HTTP request metrics from
--          backend-api-module.js into PostgreSQL (Eve's docker-compose.postgres.yml)
-- DB: tokenfly (user: tokenfly, host: localhost:5432)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. request_metrics — one row per HTTP request (high-cardinality event log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_metrics (
    id            BIGSERIAL PRIMARY KEY,
    ts            TIMESTAMPTZ     NOT NULL DEFAULT now(),  -- when request completed
    endpoint      TEXT            NOT NULL,               -- e.g. "GET /api/tasks"
    method        TEXT            NOT NULL,               -- GET, POST, PATCH, DELETE
    status_code   SMALLINT        NOT NULL,               -- HTTP status (200, 400, 500…)
    duration_ms   INTEGER         NOT NULL DEFAULT 0,     -- response time in ms
    -- derived for fast querying
    is_error      BOOLEAN GENERATED ALWAYS AS (status_code >= 400) STORED
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_rm_ts          ON request_metrics (ts DESC);
CREATE INDEX IF NOT EXISTS idx_rm_endpoint    ON request_metrics (endpoint, ts DESC);
CREATE INDEX IF NOT EXISTS idx_rm_error       ON request_metrics (is_error, ts DESC) WHERE is_error = true;
CREATE INDEX IF NOT EXISTS idx_rm_method      ON request_metrics (method, ts DESC);

-- Partition hint (for future):
-- If volume > 1M rows/day, partition by ts (RANGE) by week.

-- ---------------------------------------------------------------------------
-- 2. metrics_snapshots — periodic rollup (aggregated, low-cardinality)
--    Written by a cron job or on server shutdown / every N minutes.
--    Enables efficient historical trend queries without scanning all rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    captured_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),
    window_start    TIMESTAMPTZ     NOT NULL,  -- start of aggregation window
    window_end      TIMESTAMPTZ     NOT NULL,  -- end of aggregation window
    endpoint        TEXT            NOT NULL,
    total_requests  INTEGER         NOT NULL DEFAULT 0,
    total_errors    INTEGER         NOT NULL DEFAULT 0,
    error_rate      NUMERIC(6,4)    NOT NULL DEFAULT 0,   -- 0.0000 – 1.0000
    avg_ms          NUMERIC(8,2)    NOT NULL DEFAULT 0,
    p50_ms          NUMERIC(8,2),
    p95_ms          NUMERIC(8,2),
    p99_ms          NUMERIC(8,2),
    max_ms          INTEGER         NOT NULL DEFAULT 0,
    min_ms          INTEGER         NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ms_window_ep
    ON metrics_snapshots (window_start, window_end, endpoint);
CREATE INDEX IF NOT EXISTS idx_ms_captured ON metrics_snapshots (captured_at DESC);

-- ---------------------------------------------------------------------------
-- 3. agent_cycles — one row per agent work cycle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_cycles (
    id          BIGSERIAL PRIMARY KEY,
    agent_name  TEXT            NOT NULL,
    cycle_n     INTEGER         NOT NULL,
    started_at  TIMESTAMPTZ     NOT NULL,
    ended_at    TIMESTAMPTZ,
    turns       INTEGER,
    cost_usd    NUMERIC(10,6),
    duration_s  NUMERIC(8,2),
    -- Unique constraint: one row per agent+cycle
    CONSTRAINT uq_agent_cycle UNIQUE (agent_name, cycle_n)
);

CREATE INDEX IF NOT EXISTS idx_ac_agent     ON agent_cycles (agent_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ac_started   ON agent_cycles (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ac_cost      ON agent_cycles (cost_usd DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- 4. agent_heartbeats — heartbeat events for availability tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_heartbeats (
    id          BIGSERIAL PRIMARY KEY,
    agent_name  TEXT            NOT NULL,
    ts          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    status      TEXT            NOT NULL DEFAULT 'running',  -- running|idle|done
    task_title  TEXT
);

CREATE INDEX IF NOT EXISTS idx_ah_agent ON agent_heartbeats (agent_name, ts DESC);

-- ---------------------------------------------------------------------------
-- 5. Useful views
-- ---------------------------------------------------------------------------

-- Endpoint error rates for the last hour
CREATE OR REPLACE VIEW v_endpoint_errors_1h AS
SELECT
    endpoint,
    COUNT(*)                                        AS total_requests,
    SUM(CASE WHEN is_error THEN 1 ELSE 0 END)       AS total_errors,
    ROUND(
        SUM(CASE WHEN is_error THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(*),0), 4
    )                                               AS error_rate,
    ROUND(AVG(duration_ms)::NUMERIC, 2)             AS avg_ms,
    MAX(duration_ms)                                AS max_ms
FROM request_metrics
WHERE ts > now() - INTERVAL '1 hour'
GROUP BY endpoint
ORDER BY total_errors DESC;

-- p95 latency per endpoint (last 24h)
CREATE OR REPLACE VIEW v_endpoint_p95_24h AS
SELECT
    endpoint,
    COUNT(*)                                    AS total_requests,
    ROUND(AVG(duration_ms)::NUMERIC, 2)         AS avg_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP
        (ORDER BY duration_ms)                  AS p50_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP
        (ORDER BY duration_ms)                  AS p95_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP
        (ORDER BY duration_ms)                  AS p99_ms,
    MAX(duration_ms)                            AS max_ms
FROM request_metrics
WHERE ts > now() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY p95_ms DESC NULLS LAST;

-- Daily cost per agent
CREATE OR REPLACE VIEW v_agent_daily_cost AS
SELECT
    agent_name,
    DATE(started_at AT TIME ZONE 'UTC')         AS day,
    COUNT(*)                                    AS cycles,
    SUM(cost_usd)                               AS total_cost_usd,
    ROUND(AVG(cost_usd)::NUMERIC, 6)            AS avg_cost_per_cycle,
    SUM(turns)                                  AS total_turns
FROM agent_cycles
GROUP BY agent_name, DATE(started_at AT TIME ZONE 'UTC')
ORDER BY day DESC, total_cost_usd DESC;

-- ---------------------------------------------------------------------------
-- 6. Retention policy (run weekly via cron or pg_cron)
--    Keep raw request_metrics for 7 days; snapshots and cycles for 90 days.
-- ---------------------------------------------------------------------------
-- DELETE FROM request_metrics WHERE ts < now() - INTERVAL '7 days';
-- DELETE FROM metrics_snapshots WHERE captured_at < now() - INTERVAL '90 days';
-- DELETE FROM agent_cycles WHERE started_at < now() - INTERVAL '90 days';
-- DELETE FROM agent_heartbeats WHERE ts < now() - INTERVAL '7 days';
