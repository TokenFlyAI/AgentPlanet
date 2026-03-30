-- =============================================================================
-- Migration 003: Migrate tasks.assignee (name string) → tasks.assignee_id (UUID FK)
-- Designer: Pat (Database Engineer)
-- Date: 2026-03-29
-- Depends on: migration_001 (tokenfly_core_schema.sql), agents table seeded
-- =============================================================================
-- Purpose:
--   The current file-based task_board.md stores assignee as a plain name string
--   (e.g. "bob", "alice"). The schema uses a UUID FK to the agents table.
--   This migration backfills assignee_id for all existing tasks using a name
--   lookup, then marks the transition complete.
--
-- Pre-conditions:
--   1. agents table must be seeded (migration_001 SEED section executed)
--   2. All 20 agents must have rows in the agents table
--   3. Run this migration AFTER the file-based system is frozen (no new
--      tasks being written to task_board.md during migration)
--
-- Zero-downtime strategy:
--   - assignee_id already exists as a NULLABLE UUID FK (from migration_001)
--   - This migration only populates it — no column type changes
--   - Application can continue reading task_board.md during migration
--   - Switchover: once assignee_id is fully populated, application queries
--     tasks via DB instead of task_board.md (separate deployment)
--
-- Rollback: See end of file — simply clear assignee_id values.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- FORWARD MIGRATION
-- ---------------------------------------------------------------------------

BEGIN;

-- Step 1: Verify agents table is seeded before proceeding.
-- This will raise an exception if fewer than 20 agents exist.
DO $$
DECLARE
    agent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agent_count FROM agents;
    IF agent_count < 20 THEN
        RAISE EXCEPTION 'Migration 003 pre-condition failed: agents table has % rows, expected 20. Run seed data first.', agent_count;
    END IF;
END $$;

-- Step 2: Backfill assignee_id for tasks that have a matching agent name.
-- The task_board.md assignee column stores lowercase agent names.
-- This join uses the agents.name UNIQUE constraint for a clean lookup.
UPDATE tasks t
SET    assignee_id = a.id
FROM   agents a
WHERE  t.assignee_name = a.name   -- assignee_name is the staging column (see Step 3)
  AND  t.assignee_id IS NULL;

-- NOTE: If importing from task_board.md directly (before DB has task rows),
-- use the import script below instead. The UPDATE above applies once tasks
-- are already in the tasks table with assignee_name populated.

-- ---------------------------------------------------------------------------
-- Import helper: load tasks from task_board.md into the tasks table
-- (Run this if tasks table is empty and task_board.md has existing tasks)
-- ---------------------------------------------------------------------------
-- This is a documentation stub — actual import requires application code or
-- a psql \copy command. The column mapping is:
--
--   task_board.md column  →  tasks table column
--   -------------------      -------------------
--   ID                    →  id (override BIGSERIAL default for import)
--   Title                 →  title
--   Description           →  description
--   Priority              →  priority (map: critical/high/medium/low)
--   Assignee              →  assignee_name (staging; backfill assignee_id via UPDATE above)
--   Status                →  status (map: open/in_progress/blocked/in_review/done/cancelled)
--   Created               →  created_at
--   Updated               →  updated_at
--
-- Status value mapping (task_board.md → DB enum):
--   "open"        → 'open'
--   "in_progress" → 'in_progress'
--   "blocked"     → 'blocked'
--   "in_review"   → 'in_review'
--   "done"        → 'done'
--   "cancelled"   → 'cancelled'
--
-- NOTE: task_board.md "done" tasks missing completed_at will fail the
--   tasks_completed_at_check constraint. Set completed_at = updated_at
--   for these rows during import (updated_at is the best proxy).

-- ---------------------------------------------------------------------------
-- Step 3: Add staging column for import (if not exists)
-- Drop after migration is complete.
-- ---------------------------------------------------------------------------
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_name TEXT;
-- (Uncomment and run before the UPDATE in Step 2 if importing raw rows)

-- ---------------------------------------------------------------------------
-- Step 4: Post-migration validation
-- ---------------------------------------------------------------------------

-- Count tasks with no assignee_id where assignee_name was non-empty
-- (these are unmatched names that need manual review)
DO $$
DECLARE
    unmatched INTEGER;
BEGIN
    -- Check if assignee_name staging column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'assignee_name'
    ) THEN
        SELECT COUNT(*) INTO unmatched
        FROM tasks
        WHERE assignee_id IS NULL
          AND assignee_name IS NOT NULL
          AND trim(assignee_name) != '';

        IF unmatched > 0 THEN
            RAISE WARNING 'Migration 003: % task(s) have assignee_name set but no matching agent found. Review manually.', unmatched;
        ELSE
            RAISE NOTICE 'Migration 003: All tasks with assignee_name resolved to assignee_id successfully.';
        END IF;
    ELSE
        RAISE NOTICE 'Migration 003: No assignee_name staging column found — skipping validation.';
    END IF;
END $$;

-- Step 5: Drop staging column (after validation passes and deployment confirmed)
-- ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;
-- (Uncomment and run in a follow-up migration once migration is confirmed clean)

COMMIT;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- To reverse this migration (undo backfill):
--
--   BEGIN;
--   UPDATE tasks SET assignee_id = NULL;
--   COMMIT;
--
-- No schema changes are reversed (assignee_id column stays — it was in migration_001).
-- The agents table is unchanged.
-- The staging column (if added) can be dropped:
--   ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;

-- ---------------------------------------------------------------------------
-- POST-MIGRATION NOTES
-- ---------------------------------------------------------------------------
-- 1. Bob: Once migration is confirmed, update PATCH /api/tasks/:id to accept
--    assignee by name and resolve to UUID internally (or accept UUID directly).
--    The DB will enforce FK integrity — passing an invalid agent name should
--    return 422, not silently store a broken reference.
--
-- 2. Dave: The frontend task form should query GET /api/agents for the
--    dropdown of valid assignees (names with UUIDs). Stop sending plain
--    name strings as assignee; send agent UUID.
--
-- 3. Grace: If data pipelines read from task_board.md, coordinate cutover
--    to the tasks table once this migration is confirmed.
--
-- 4. Eve: This migration requires a running PostgreSQL 15+ instance.
--    Coordinate with Pat before execution window.
