# Tokenfly Platform — Database Schema Design

**Author**: Pat (Database Engineer)
**Date**: 2026-03-29
**Status**: Draft — ready for review

---

## Overview

This document describes the core PostgreSQL schema for the Tokenfly Agent Team Lab platform. It covers the entities required to support agent management, task tracking, inter-agent messaging, session history, announcements, and audit logging.

---

## Entity Relationship Summary

```
agents (1) ──< sessions (N)
agents (1) ──< tasks.assignee_id (N)
agents (1) ──< messages.to_agent_id (N)
agents (1) ──< messages.from_agent_id (N)
agents (1) ──< task_comments.author_id (N)
agents (1) ──< announcements.author_id (N)
tasks  (1) ──< task_comments.task_id (N)
```

---

## Tables

### `agents`
Registry of all 20 agents + CEO. Tracks role, department, reporting structure, live status, and last heartbeat.

**Key constraints**:
- `name` is unique and non-empty
- `reports_to_id` self-references (Alice is root)
- `current_status` limited to known enum values

**Indexes**:
- `name` — direct lookup
- `current_status` — dashboard "who's online" queries
- `last_heartbeat DESC` — health monitoring

---

### `tasks`
Represents all work items on the task board.

**Key constraints**:
- `completed_at` must be set when `status = 'done'` (enforced by CHECK)
- `due_at > created_at` — prevent backdated due dates
- Soft-filtered index for active tasks (`WHERE status NOT IN ('done','cancelled')`)

**Indexes**:
- `(assignee_id)` with partial filter for open tasks — inbox-style query
- `(priority, status)` — task board sorted view
- `(created_at DESC)` — audit trail

---

### `task_comments`
Discussion thread on each task. Cascades delete with task.

---

### `sessions`
One row per agent invocation / work cycle. Used for performance analytics and debugging (which model was used, how long sessions ran).

**Key constraints**:
- `ended_at >= started_at`

**Indexes**:
- `(agent_id)` with partial filter `WHERE ended_at IS NULL` — find currently running agents

---

### `messages`
All point-to-point and broadcast messages. Supports inbox queries (unread, ordered by recency), CEO-priority filtering, and broadcast history.

**Key constraints**:
- `read_at >= created_at` — prevents backdated reads
- `body` non-empty

**Indexes**:
- Partial index on unread inbox — fast inbox load
- Partial index on unread CEO messages — priority filter
- Partial index on broadcasts

---

### `announcements`
Public team posts. Supports pinning and expiry.

---

### `company_mode_log`
Append-only history of all `plan/normal/crazy` mode switches. Enables audit trail and trend analysis.

---

### `audit_log`
Append-only, immutable log of all significant platform actions. Uses JSONB for flexible detail storage with GIN index for searchability.

**Design note**: `entity_id` is stored as TEXT (not BIGINT/UUID) to support heterogeneous entity types without multiple nullable FK columns.

---

## Migration Strategy

All schema changes will follow this procedure:

1. **Write forward migration** (`V{n}__description.sql`)
2. **Write rollback migration** (`V{n}__description__rollback.sql`)
3. **Test on staging** with production-sized dataset
4. **EXPLAIN ANALYZE** on all affected queries
5. **Zero-downtime plan**: use `ADD COLUMN ... DEFAULT NULL` first, backfill, then add NOT NULL constraint
6. **Deploy with monitoring**: watch error rates and query latency for 15 minutes post-migration

---

## Indexing Philosophy

- **Partial indexes** on filtered queries (e.g., unread messages only) — avoids bloat from rows that will never match the filter
- **Composite indexes** ordered by selectivity (high-cardinality first)
- **GIN** for JSONB columns
- **No speculative indexes** — every index is justified by an actual query pattern

---

## Open Questions / Next Steps

1. **Bob**: Do you need any additional columns in `tasks` for your data model? Let me know before I finalize.
2. **Grace**: Will you need partition keys on `audit_log` or `sessions` for analytics? If audit_log grows fast, range partitioning by `created_at` month is recommended.
3. **Nick**: Once the platform is live, let's profile the 5 most frequent queries and verify these indexes cover them.
4. **Eve**: What PostgreSQL version will infra provision? Schema targets PG 15+.

---

## Files

| File | Description |
|------|-------------|
| `output/tokenfly_core_schema.sql` | DDL — tables, indexes, triggers, seed data |
| `output/tokenfly_schema_design_doc.md` | This document |
