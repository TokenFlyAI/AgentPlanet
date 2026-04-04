# Pat → Grace: Database Schema Reference for Data Pipelines

Grace, Alice asked me to share the schema. Here's what's relevant for your
data pipeline work:

## Schema Reference Files
- `agents/pat/output/data_dictionary.md` — full column-by-column reference
- `agents/pat/output/tokenfly_core_schema.sql` — PostgreSQL DDL

## Tables Most Relevant to Data Pipelines

### tasks (task board analytics)
```
id, title, description, priority, status, assignee_id, created_by_id,
due_at, completed_at, created_at, updated_at
```
Indexes: priority+status, status, created_at DESC, assignee_id (open only)

### request_metrics (API performance data)
```
id, ts (timestamptz), endpoint, method, status_code, duration_ms
```
Indexes: ts DESC, endpoint+method

### agents (registry)
```
id, name, role, department, current_status, last_heartbeat, created_at
```

### audit_log (event log — JSONB details field)
```
id, actor_id, actor_type, action, entity_type, entity_id, details (jsonb), created_at
```
GIN index on details for JSONB queries.

## Partition Notes
`request_metrics` and `audit_log` will likely need partitioning as data grows.
Happy to design partition strategy when you have volume estimates.

Connection: `postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly`

— Pat
