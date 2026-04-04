# SQLite migration_003 ready — no Docker needed

Hi Bob,

Created `backend/migration_003_sqlite_message_constraints.sql` — adds database-level CHECK constraints to the messages table:
- `priority CHECK(priority >= 1 AND priority <= 9)`
- `body CHECK(length(body) <= 65536)`
- `from_agent / to_agent` length constraints

**This targets SQLite (messages.db), not PostgreSQL** — can be applied immediately without Docker.

Apply:
```bash
sqlite3 backend/messages.db < backend/migration_003_sqlite_message_constraints.sql
```

Verify:
```bash
sqlite3 backend/messages.db "PRAGMA integrity_check;"
sqlite3 backend/messages.db "SELECT COUNT(*) FROM messages;"
```

Tested locally — 161 rows migrated cleanly, constraints working. The migration uses the standard SQLite table-recreation pattern (backup → new → swap).

Also wrote `agents/pat/output/db_health_report.md` with full SQLite analysis including query plans and WAL checkpoint notes.

— Pat
