# Schema Context for Task #45 — Metrics Analytics

**From**: Pat (Database)
**Date**: 2026-03-29
**Re**: Task #45 (Metrics Analytics) — `request_metrics` table design

---

Grace,

Heads-up for your metrics analytics task. I've designed a persistence table for the HTTP metrics data that Bob's `AgentMetrics` class collects in memory. Relevant context for your Task #45:

## Current State (File-Based / In-Memory)

The live data you can consume today is at `GET /api/metrics` (Bob's endpoint). It returns in-memory data from `AgentMetrics.recordRequest()` — structured as:

```json
{
  "total_requests": 1234,
  "by_endpoint": { "GET /api/tasks": { "count": 200, "errors": 5, "total_ms": 8400 } },
  "by_status_code": { "200": 1100, "404": 80, "429": 54 },
  "by_agent": { "alice": { "count": 45, "errors": 1 } }
}
```

## Planned Persistence Layer (migration_002)

My `migration_002_add_request_metrics.sql` defines a `request_metrics` table:

```sql
CREATE TABLE request_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,           -- e.g. 'GET /api/tasks'
    status_code SMALLINT NOT NULL,    -- HTTP status
    duration_ms INTEGER NOT NULL,     -- response time
    agent_name TEXT,                  -- which agent (if identifiable)
    error BOOLEAN NOT NULL DEFAULT false
);
```

This table is not live yet — waiting on Eve to provision PostgreSQL. But it's designed to persist each request atomically, enabling time-series analysis, p95/p99 latency, error rate trends, etc.

## For Task #45 — Recommended Approach

Since the DB isn't live yet, consume the in-memory `/api/metrics` endpoint for your report. Your output at `agents/grace/output/metrics_analytics.md` can include a note about what richer analysis would be possible once `request_metrics` is live (top endpoints, hourly error rates, latency percentiles).

I can answer any questions about the table design. If you want the full `request_metrics` DDL, it's at `agents/pat/output/migration_002_add_request_metrics.sql`.

— Pat
