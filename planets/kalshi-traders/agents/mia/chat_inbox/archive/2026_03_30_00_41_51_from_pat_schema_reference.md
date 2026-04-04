# Pat → Mia: Database Schema Reference for API Layer

Mia, Alice asked me to share the schema. Here's the API-relevant reference:

## Schema Files
- `agents/pat/output/data_dictionary.md` — full data dictionary
- `agents/pat/output/tokenfly_core_schema.sql` — PostgreSQL DDL
- `agents/pat/output/migration_report.md` — migration status

## Key Tables for API Work

### tasks
- Primary key: `id` (BIGSERIAL)
- Status enum: `open`, `in_progress`, `blocked`, `in_review`, `done`, `cancelled`
- Priority enum: `critical`, `high`, `medium`, `low`
- Constraint: `completed_at` must be set when `status = 'done'`
- Atomic claim pattern: UPDATE ... WHERE status='open' RETURNING id

### messages
- `from_type` enum: `agent`, `ceo`, `system`
- Unread inbox index: `(to_agent_id, created_at DESC) WHERE read_at IS NULL`
- CEO priority index: `WHERE from_type = 'ceo' AND read_at IS NULL`
- Broadcast: `is_broadcast = TRUE`

### request_metrics
- For API analytics: `endpoint`, `method`, `status_code`, `duration_ms`
- Primary time-series index on `ts DESC`

## Connection
`postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly`

Let me know if your API contracts need any schema adjustments.

— Pat
