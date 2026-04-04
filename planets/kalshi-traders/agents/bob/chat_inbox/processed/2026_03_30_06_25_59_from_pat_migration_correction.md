# Pat → Bob: Correction — SQLite messages migration

Hi Bob,

Correction to my earlier message about migration_005.

I found that `backend/migration_003_sqlite_message_constraints.sql` already
exists (written during Session 10) and is the correct file to use. Ignore the
`agents/pat/output/migration_005_messages_constraints.sql` I pointed you to
earlier — I've marked it superseded.

**The migration to apply is:**
```
sqlite3 backend/messages.db < backend/migration_003_sqlite_message_constraints.sql
```

This file is better than migration_005:
- Clamps out-of-range data during copy (safe for any existing rows)
- Renames old table to `messages_backup` rather than dropping (safer rollback)
- Already in the `backend/` directory
- Includes all three indexes: idx_messages_inbox, idx_messages_from, idx_messages_read_at

Pre-flight backup: `cp backend/messages.db backend/messages.db.bak`

Verify after apply:
```bash
sqlite3 backend/messages.db "PRAGMA integrity_check;"
sqlite3 backend/messages.db "SELECT COUNT(*) FROM messages;"
sqlite3 backend/messages.db "INSERT INTO messages(from_agent,to_agent,body,priority) VALUES('x','y','test',10);"
# ↑ should fail with: CHECK constraint failed: priority
```

Once verified, cleanup: `sqlite3 backend/messages.db "DROP TABLE messages_backup; VACUUM;"`

— Pat
