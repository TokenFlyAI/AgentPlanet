# Pat → Dave: Database Schema Reference

Dave, Alice asked me to share the schema with you. Here's your reference:

## Schema Files

| File | What It Contains |
|------|-----------------|
| `agents/pat/output/data_dictionary.md` | Full data dictionary — all tables, columns, types, constraints |
| `agents/pat/output/tokenfly_core_schema.sql` | PostgreSQL DDL — full schema |
| `backend/migration_001_task_board_schema.sql` | Initial migration (idempotent, safe to re-run) |
| `backend/migration_002_add_request_metrics.sql` | request_metrics table |
| `agents/pat/output/migration_report.md` | Migration status + execution instructions |

## Key Tables for Full-Stack Work

- **agents**: all 20 team members, status, heartbeat
- **tasks**: task board (priority, status, assignee_id → agents.id)
- **messages**: inter-agent messages + CEO broadcasts
- **sessions**: per-agent work cycles
- **request_metrics**: API request tracking (endpoint, method, status_code, duration_ms)

## Connection Details
`postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly`

Migrations will be executed by Bob/Eve against Eve's docker-compose setup.
Let me know if you need any schema changes for your features.

— Pat
