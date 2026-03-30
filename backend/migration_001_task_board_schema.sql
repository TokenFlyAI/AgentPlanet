-- =============================================================================
-- migration_001_task_board_schema.sql
-- Tokenfly Agent Team Lab — Initial Task Board Schema
-- Author: Pat (Database Engineer) — 2026-03-30
-- Task: #114
--
-- Purpose: Bootstrap core schema — agents registry, task board, messages,
--          sessions, announcements, company_mode_log, audit_log.
--
-- Apply:
--   docker exec -i tokenfly-postgres \
--     psql -U tokenfly -d tokenfly \
--     < backend/migration_001_task_board_schema.sql
--
-- Rollback:
--   DROP SCHEMA public CASCADE; CREATE SCHEMA public;
--   -- (full schema teardown — development only)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE agent_role AS ENUM (
        'ceo', 'acting_ceo', 'tpm', 'qa_lead', 'qa_engineer',
        'backend', 'frontend', 'fullstack', 'infra', 'data',
        'security', 'ml', 'mobile', 'platform', 'sre',
        'api', 'performance', 'database', 'cloud', 'distributed_systems'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE agent_status AS ENUM (
        'online', 'offline', 'idle', 'blocked', 'error'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM (
        'critical', 'high', 'medium', 'low'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'open', 'in_progress', 'blocked', 'in_review', 'done', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE company_mode AS ENUM (
        'plan', 'normal', 'crazy'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE message_sender_type AS ENUM (
        'agent', 'ceo', 'system'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABLE: agents
-- Registry of all agents in the system.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT         NOT NULL,
    role            agent_role   NOT NULL,
    department      TEXT         NOT NULL,
    reports_to_id   UUID         REFERENCES agents(id) ON DELETE SET NULL,
    current_status  agent_status NOT NULL DEFAULT 'offline',
    last_heartbeat  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT agents_name_unique  UNIQUE (name),
    CONSTRAINT agents_name_nonempty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_agents_name           ON agents (name);
CREATE INDEX IF NOT EXISTS idx_agents_status         ON agents (current_status);
CREATE INDEX IF NOT EXISTS idx_agents_last_heartbeat ON agents (last_heartbeat DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- TABLE: tasks
-- Task board — all work items for the team.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id              BIGSERIAL     PRIMARY KEY,
    title           TEXT          NOT NULL,
    description     TEXT,
    priority        task_priority NOT NULL DEFAULT 'medium',
    status          task_status   NOT NULL DEFAULT 'open',
    assignee_id     UUID          REFERENCES agents(id) ON DELETE SET NULL,
    created_by_id   UUID          REFERENCES agents(id) ON DELETE SET NULL,
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT tasks_title_nonempty     CHECK (char_length(trim(title)) > 0),
    CONSTRAINT tasks_completed_at_check CHECK (
        (status = 'done' AND completed_at IS NOT NULL) OR
        (status != 'done')
    ),
    CONSTRAINT tasks_due_after_created  CHECK (
        due_at IS NULL OR due_at > created_at
    )
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee       ON tasks (assignee_id)      WHERE status != 'done' AND status != 'cancelled';
CREATE INDEX IF NOT EXISTS idx_tasks_priority_status ON tasks (priority, status);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at     ON tasks (created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: task_comments
-- Discussion and updates on tasks.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_comments (
    id          BIGSERIAL            PRIMARY KEY,
    task_id     BIGINT               NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id   UUID                 REFERENCES agents(id) ON DELETE SET NULL,
    author_type message_sender_type  NOT NULL DEFAULT 'agent',
    body        TEXT                 NOT NULL,
    created_at  TIMESTAMPTZ          NOT NULL DEFAULT now(),

    CONSTRAINT task_comments_body_nonempty CHECK (char_length(trim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments (task_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: sessions
-- Each agent invocation / work cycle is a session.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at    TIMESTAMPTZ,
    model_used  TEXT,
    notes       TEXT,

    CONSTRAINT sessions_ended_after_started CHECK (
        ended_at IS NULL OR ended_at >= started_at
    )
);

CREATE INDEX IF NOT EXISTS idx_sessions_agent  ON sessions (agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions (agent_id) WHERE ended_at IS NULL;

-- ---------------------------------------------------------------------------
-- TABLE: messages
-- All inter-agent and CEO→agent messages.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id            BIGSERIAL            PRIMARY KEY,
    from_agent_id UUID                 REFERENCES agents(id) ON DELETE SET NULL,
    from_type     message_sender_type  NOT NULL DEFAULT 'agent',
    to_agent_id   UUID                 NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    subject       TEXT,
    body          TEXT                 NOT NULL,
    is_broadcast  BOOLEAN              NOT NULL DEFAULT FALSE,
    read_at       TIMESTAMPTZ,
    archived_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ          NOT NULL DEFAULT now(),

    CONSTRAINT messages_body_nonempty    CHECK (char_length(trim(body)) > 0),
    CONSTRAINT messages_read_after_created CHECK (
        read_at IS NULL OR read_at >= created_at
    )
);

CREATE INDEX IF NOT EXISTS idx_messages_inbox     ON messages (to_agent_id, created_at DESC)
    WHERE read_at IS NULL AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_from_ceo  ON messages (to_agent_id, created_at DESC)
    WHERE from_type = 'ceo' AND read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_broadcast ON messages (created_at DESC)
    WHERE is_broadcast = TRUE;

-- ---------------------------------------------------------------------------
-- TABLE: announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
    id          BIGSERIAL            PRIMARY KEY,
    author_id   UUID                 REFERENCES agents(id) ON DELETE SET NULL,
    author_type message_sender_type  NOT NULL DEFAULT 'agent',
    title       TEXT                 NOT NULL,
    body        TEXT                 NOT NULL,
    pinned      BOOLEAN              NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ          NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ,

    CONSTRAINT announcements_title_nonempty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT announcements_expires_after_created CHECK (
        expires_at IS NULL OR expires_at > created_at
    )
);

CREATE INDEX IF NOT EXISTS idx_announcements_recent ON announcements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements (pinned, created_at DESC)
    WHERE pinned = TRUE;

-- ---------------------------------------------------------------------------
-- TABLE: company_mode_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_mode_log (
    id           BIGSERIAL    PRIMARY KEY,
    mode         company_mode NOT NULL,
    set_by       TEXT         NOT NULL,
    set_by_id    UUID         REFERENCES agents(id) ON DELETE SET NULL,
    reason       TEXT,
    effective_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT company_mode_log_set_by_nonempty CHECK (char_length(trim(set_by)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_company_mode_log_recent ON company_mode_log (effective_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: audit_log
-- Immutable append-only log of all significant actions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL            PRIMARY KEY,
    actor_id    UUID                 REFERENCES agents(id) ON DELETE SET NULL,
    actor_type  message_sender_type  NOT NULL DEFAULT 'agent',
    action      TEXT                 NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    details     JSONB,
    created_at  TIMESTAMPTZ          NOT NULL DEFAULT now(),

    CONSTRAINT audit_log_action_nonempty CHECK (char_length(trim(action)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_recent ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor  ON audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_details ON audit_log USING gin (details);

-- ---------------------------------------------------------------------------
-- TRIGGERS: auto-update updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    CREATE TRIGGER trg_agents_updated_at
        BEFORE UPDATE ON agents
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_tasks_updated_at
        BEFORE UPDATE ON tasks
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- SEED: initial agents (20 team members)
-- ---------------------------------------------------------------------------
INSERT INTO agents (name, role, department) VALUES
    ('alice',   'acting_ceo',          'Leadership'),
    ('sam',     'tpm',                 'Leadership'),
    ('olivia',  'tpm',                 'Leadership'),
    ('tina',    'qa_lead',             'QA'),
    ('frank',   'qa_engineer',         'QA'),
    ('bob',     'backend',             'Engineering'),
    ('charlie', 'frontend',            'Engineering'),
    ('dave',    'fullstack',           'Engineering'),
    ('eve',     'infra',               'Engineering'),
    ('grace',   'data',                'Engineering'),
    ('heidi',   'security',            'Engineering'),
    ('ivan',    'ml',                  'Engineering'),
    ('judy',    'mobile',              'Engineering'),
    ('karl',    'platform',            'Engineering'),
    ('liam',    'sre',                 'Engineering'),
    ('mia',     'api',                 'Engineering'),
    ('nick',    'performance',         'Engineering'),
    ('pat',     'database',            'Engineering'),
    ('quinn',   'cloud',               'Engineering'),
    ('rosa',    'distributed_systems', 'Engineering')
ON CONFLICT (name) DO NOTHING;

-- Wire up reports_to for all non-leadership agents → alice
UPDATE agents
SET    reports_to_id = (SELECT id FROM agents WHERE name = 'alice')
WHERE  name NOT IN ('alice', 'sam', 'olivia')
  AND  reports_to_id IS NULL;

COMMIT;
