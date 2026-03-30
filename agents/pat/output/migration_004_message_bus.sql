-- =============================================================================
-- Migration 004: Message Bus — Priority Queue + Push Delivery
-- Designer: Pat (Database Engineer)
-- Date: 2026-03-30
-- Depends on: migration_001 (tokenfly_core_schema.sql)
-- Requested by: Rosa (Distributed Systems, Task #50 design doc)
-- Implements: Task #102 (Message Bus API) schema requirements
-- =============================================================================
-- Purpose: Upgrade the `messages` table to support:
--   1. Priority-ordered inbox queue (CEO messages first)
--   2. LISTEN/NOTIFY push delivery (eliminates polling latency)
--   3. Broadcast fan-out via trigger (single INSERT → 1 row per agent)
--   4. At-least-once delivery via SKIP LOCKED claim pattern
--   5. Body size cap + idempotency key for duplicate handling
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Priority column
-- ---------------------------------------------------------------------------
-- Priority scale: 1 = CEO/critical (highest), 5 = normal, 9 = low
-- Matches Rosa's design: ORDER BY priority ASC, created_at ASC

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS priority     SMALLINT NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,      -- optional: prevent duplicate sends
    ADD COLUMN IF NOT EXISTS claimed_at   TIMESTAMPTZ,  -- set when agent claims via SKIP LOCKED
    ADD COLUMN IF NOT EXISTS claimed_by   TEXT;         -- agent name that claimed the message

ALTER TABLE messages
    ADD CONSTRAINT messages_priority_range CHECK (priority BETWEEN 1 AND 9),
    ADD CONSTRAINT messages_body_maxlen CHECK (char_length(body) <= 65536); -- 64KB cap

-- Unique idempotency key per sender (null allowed — only enforce when set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency
    ON messages (from_agent_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- PART 2: Inbox index with priority ordering
-- ---------------------------------------------------------------------------
-- Drop old non-prioritized inbox index, replace with priority-aware version.
-- SKIP LOCKED queries: WHERE to_agent_id = $1 AND read_at IS NULL AND claimed_at IS NULL
--                      ORDER BY priority ASC, created_at ASC

DROP INDEX IF EXISTS idx_messages_inbox;

CREATE INDEX idx_messages_inbox_priority
    ON messages (to_agent_id, priority ASC, created_at ASC)
    WHERE read_at IS NULL AND archived_at IS NULL AND claimed_at IS NULL;

-- Keep the CEO fast-path index (priority=1 shortcut, unchanged)
-- idx_messages_from_ceo already covers this; keep as-is.

-- ---------------------------------------------------------------------------
-- PART 3: LISTEN/NOTIFY trigger — push delivery
-- ---------------------------------------------------------------------------
-- Fires after each INSERT on messages.
-- Sends: pg_notify('messages_<to_agent>', '<message_id>')
-- Agents run: LISTEN messages_alice  (on startup)
-- On NOTIFY: agent calls GET /api/messages/inbox immediately
-- Fallback: agent also polls every 10s (handles LISTEN connection drops)

CREATE OR REPLACE FUNCTION notify_message_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Look up the agent name for push notification channel
    PERFORM pg_notify(
        'messages_' || (SELECT name FROM agents WHERE id = NEW.to_agent_id),
        NEW.id::text
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_message_insert ON messages;
CREATE TRIGGER trg_notify_message_insert
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_message_insert();

-- ---------------------------------------------------------------------------
-- PART 4: Broadcast fan-out trigger
-- ---------------------------------------------------------------------------
-- When a message is inserted with is_broadcast = TRUE:
--   - Copy one row per active agent into messages (as individual DMs)
--   - Delete the original broadcast placeholder row
-- This converts O(N) API writes into a single INSERT + trigger expansion.
--
-- NOTE: from_agent_id may be NULL for CEO/system broadcasts — handled.

CREATE OR REPLACE FUNCTION fanout_broadcast_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_broadcast = TRUE THEN
        -- Insert one message per active agent (excluding the sender)
        INSERT INTO messages (
            from_agent_id,
            from_type,
            to_agent_id,
            subject,
            body,
            is_broadcast,
            priority,
            created_at
        )
        SELECT
            NEW.from_agent_id,
            NEW.from_type,
            a.id,
            NEW.subject,
            NEW.body,
            FALSE,           -- individual copy, not broadcast
            NEW.priority,
            NEW.created_at
        FROM agents a
        WHERE a.status != 'inactive'
          AND (NEW.from_agent_id IS NULL OR a.id != NEW.from_agent_id);

        -- Remove the broadcast placeholder
        DELETE FROM messages WHERE id = NEW.id;
    END IF;
    RETURN NULL; -- AFTER trigger, return value ignored
END;
$$;

DROP TRIGGER IF EXISTS trg_fanout_broadcast ON messages;
CREATE TRIGGER trg_fanout_broadcast
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.is_broadcast = TRUE)
    EXECUTE FUNCTION fanout_broadcast_message();

-- ---------------------------------------------------------------------------
-- PART 5: SKIP LOCKED claim helper view
-- ---------------------------------------------------------------------------
-- Not strictly required, but useful for Bob's implementation.
-- Bob can query this view for the next unclaimed message for an agent.
--
-- Usage from Node.js (agent_name = 'alice'):
--   BEGIN;
--   SELECT id, from_type, subject, body, priority FROM next_inbox_message
--     WHERE to_agent_name = 'alice'
--     FOR UPDATE SKIP LOCKED
--     LIMIT 1;
--   UPDATE messages SET claimed_at = now(), claimed_by = 'alice', read_at = now()
--     WHERE id = $returned_id;
--   COMMIT;
--
-- NOTE: The FOR UPDATE clause must be on the base table, not the view.
--       This view is for convenience only — Bob should query messages directly
--       for the SKIP LOCKED transaction.

CREATE OR REPLACE VIEW v_inbox_unread AS
SELECT
    m.id,
    m.priority,
    m.created_at,
    a_from.name  AS from_agent,
    m.from_type,
    a_to.name    AS to_agent_name,
    m.to_agent_id,
    m.subject,
    m.body,
    m.idempotency_key
FROM messages m
JOIN agents a_to ON a_to.id = m.to_agent_id
LEFT JOIN agents a_from ON a_from.id = m.from_agent_id
WHERE m.read_at     IS NULL
  AND m.archived_at IS NULL
  AND m.claimed_at  IS NULL;

-- ---------------------------------------------------------------------------
-- PART 6: Unread count alerting view
-- ---------------------------------------------------------------------------
-- Liam's SRE dashboard: alert if unread count > 100 or oldest unread > 5min

CREATE OR REPLACE VIEW v_inbox_health AS
SELECT
    a.name                                       AS agent_name,
    COUNT(m.id)                                  AS unread_count,
    MIN(m.created_at)                            AS oldest_unread,
    EXTRACT(EPOCH FROM (now() - MIN(m.created_at))) / 60
                                                 AS oldest_unread_age_minutes,
    CASE
        WHEN COUNT(m.id) > 100                   THEN 'critical'
        WHEN COUNT(m.id) > 20                    THEN 'warning'
        WHEN MIN(m.created_at) < now() - INTERVAL '5 minutes' THEN 'warning'
        ELSE 'ok'
    END                                          AS health_status
FROM agents a
LEFT JOIN messages m
    ON m.to_agent_id = a.id
    AND m.read_at IS NULL
    AND m.archived_at IS NULL
GROUP BY a.id, a.name
ORDER BY unread_count DESC;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- To reverse this migration:
--
--   DROP VIEW IF EXISTS v_inbox_health;
--   DROP VIEW IF EXISTS v_inbox_unread;
--   DROP TRIGGER IF EXISTS trg_fanout_broadcast ON messages;
--   DROP FUNCTION IF EXISTS fanout_broadcast_message();
--   DROP TRIGGER IF EXISTS trg_notify_message_insert ON messages;
--   DROP FUNCTION IF EXISTS notify_message_insert();
--   DROP INDEX IF EXISTS idx_messages_inbox_priority;
--   CREATE INDEX idx_messages_inbox ON messages (to_agent_id, created_at DESC)
--     WHERE read_at IS NULL AND archived_at IS NULL;
--   DROP INDEX IF EXISTS idx_messages_idempotency;
--   ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_body_maxlen;
--   ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_priority_range;
--   ALTER TABLE messages
--     DROP COLUMN IF EXISTS claimed_by,
--     DROP COLUMN IF EXISTS claimed_at,
--     DROP COLUMN IF EXISTS idempotency_key,
--     DROP COLUMN IF EXISTS priority;
--
-- Note: No data loss to existing messages — only structural additions removed.

-- ---------------------------------------------------------------------------
-- INTEGRATION NOTES for Bob (Task #102)
-- ---------------------------------------------------------------------------
--
-- Endpoints to implement per Rosa's spec:
--
--   POST /api/messages
--     Body: { from, to, subject, body, priority=5, is_broadcast=false }
--     SQL:  INSERT INTO messages (...) VALUES (...)
--           RETURNING id, created_at
--     Note: If is_broadcast=true, trigger handles fan-out automatically.
--
--   GET /api/messages/inbox?agent=<name>
--     SQL:  SELECT * FROM messages WHERE to_agent_id = $agentId
--             AND read_at IS NULL AND claimed_at IS NULL
--             ORDER BY priority ASC, created_at ASC
--             FOR UPDATE SKIP LOCKED LIMIT 10
--     Note: Wrap in BEGIN/COMMIT; set claimed_at after SELECT.
--
--   POST /api/messages/:id/ack
--     SQL:  UPDATE messages SET read_at = now() WHERE id = $1
--
--   GET /api/messages/queue-depth
--     SQL:  SELECT * FROM v_inbox_health
--
--   LISTEN setup (per agent connection):
--     LISTEN messages_alice;  -- fires when new message arrives for alice
--     On notify: call GET /api/messages/inbox immediately
--
-- Connection string (Eve's docker-compose):
--   postgresql://tokenfly:tokenfly_dev@localhost:5432/tokenfly
