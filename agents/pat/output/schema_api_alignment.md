# Schema ↔ API Alignment Analysis
**Author**: Pat (Database Engineer)
**Date**: 2026-03-29
**Subject**: Mapping Bob's backend/api.js data models to tokenfly_core_schema.sql

---

## Summary

Bob's `backend/api.js` is a file-backed REST API. This document maps each data
structure Bob reads/writes to the corresponding PostgreSQL table(s) in
`tokenfly_core_schema.sql`. It identifies field mismatches, missing constraints,
and required changes before a DB migration can be executed.

---

## 1. Agents — `listAgents()` / `getAgent()`

### Bob's API response shape

```js
{
  name:            string,   // agent directory name
  alive:           boolean,  // heartbeat < 5 min old
  heartbeat_at:    ISO8601 | null,
  current_task:    string | null,  // parsed from status.md
  unread_messages: number,
}
```

### Schema mapping → `agents` table

| API field | Schema column | Match? | Notes |
|-----------|---------------|--------|-------|
| `name` | `agents.name` | ✅ | TEXT NOT NULL UNIQUE |
| `alive` | derived from `agents.last_heartbeat` | ✅ | Computed: `last_heartbeat > now() - interval '5 minutes'` |
| `heartbeat_at` | `agents.last_heartbeat` | ✅ | TIMESTAMPTZ |
| `current_task` | not in `agents` | ⚠️ | Current task lives in `sessions` + `tasks`. Agent detail should JOIN |
| `unread_messages` | not in `agents` | ⚠️ | Count from `messages WHERE to_agent_id = ? AND read_at IS NULL` |

### Fields in schema NOT in Bob's API

| Schema column | Bob API | Gap |
|---------------|---------|-----|
| `agents.role` | absent | Bob doesn't expose agent role — needed for UI/routing logic |
| `agents.department` | absent | Useful for team grouping queries |
| `agents.reports_to_id` | absent | Org chart / chain-of-command |
| `agents.current_status` (enum) | derived from heartbeat only | Schema has explicit `agent_status` enum: online/offline/idle/blocked/error |

**Action needed**: Bob's agent API should include `role`, `department`, and explicit
`status` enum once backing DB is in place. For now, the file-based system has no
`role` field stored per agent — only inferred from directory name.

---

## 2. Tasks — `parseTaskBoard()` / `serializeTaskBoard()`

### Bob's task shape (parsed from task_board.md)

```js
{
  id:          integer,   // sequential, from markdown table
  title:       string,
  description: string,
  priority:    'low' | 'medium' | 'high' | 'critical',
  assignee:    string,    // agent name (lowercase), or 'unassigned'
  status:      'open' | 'in_progress' | 'done' | 'blocked',
  created:     'YYYY-MM-DD',
  updated:     'YYYY-MM-DD',
}
```

### Schema mapping → `tasks` table

| API field | Schema column | Match? | Notes |
|-----------|---------------|--------|-------|
| `id` | `tasks.id` (BIGSERIAL) | ✅ | Sequential integer — compatible |
| `title` | `tasks.title` | ✅ | TEXT NOT NULL |
| `description` | `tasks.description` | ✅ | TEXT (nullable) |
| `priority` | `tasks.priority` (task_priority enum) | ✅ | Same 4 values |
| `assignee` | `tasks.assignee_id` (FK → agents.id) | ⚠️ | **Gap**: Bob stores name string; schema uses UUID FK |
| `status` | `tasks.status` (task_status enum) | ⚠️ | Schema adds `in_review` + `cancelled` — Bob doesn't have these |
| `created` | `tasks.created_at` | ⚠️ | Bob stores date string `YYYY-MM-DD`; schema uses TIMESTAMPTZ |
| `updated` | `tasks.updated_at` | ⚠️ | Same date-vs-timestamp difference |
| — | `tasks.due_at` | gap | Not in Bob's API — missing field |
| — | `tasks.completed_at` | gap | Not in Bob's API — schema enforces this for 'done' tasks |
| — | `tasks.created_by_id` | gap | Not tracked by Bob's API |

### Critical gap: `completed_at` constraint

My schema enforces:
```sql
CONSTRAINT tasks_completed_at_check CHECK (
    (status = 'done' AND completed_at IS NOT NULL) OR
    (status != 'done')
)
```

Bob's API can set `status = 'done'` without setting `completed_at`. When
migrating to DB, the `PATCH /api/tasks/:id` handler MUST set `completed_at`
automatically when transitioning to `done`.

**Resolution**: Add to Bob's PATCH handler:
```js
if (body.status === 'done' && !tasks[idx].completed_at) {
  tasks[idx].completed_at = new Date().toISOString();
}
```
This can be added as a DB trigger or application-layer guard.

---

## 3. Messages — `sendMessage()`

### Bob's message shape

```js
// Written as markdown file to: agents/{name}/chat_inbox/{ts}_from_{from}.md
// File contains: raw markdown content string
// Metadata encoded in filename only
```

### Schema mapping → `messages` table

| File metadata | Schema column | Match? | Notes |
|---------------|---------------|--------|-------|
| filename timestamp | `messages.created_at` | ✅ | Parseable from filename |
| `from_*` suffix | `messages.from_agent_id` + `messages.from_type` | ⚠️ | 'ceo' suffix → from_type='ceo'; agent name → lookup FK |
| directory agent name | `messages.to_agent_id` | ✅ | Resolve name → UUID via agents table |
| file content | `messages.body` | ✅ | TEXT NOT NULL |
| `read_` prefix | `messages.read_at` | ✅ | NULL = unread; TIMESTAMPTZ when prefixed |
| — | `messages.subject` | gap | No subject in file-based messages |
| — | `messages.is_broadcast` | gap | Broadcast not tracked per-message (inferred from multi-target write) |

**Gap**: Broadcast detection. Bob's API sends individual files per agent for
broadcasts — there's no single broadcast record. Schema has `is_broadcast BOOLEAN`
on messages. A broadcast_id foreign key (to a `broadcasts` table) would better
model this.

**Recommendation**: Add `broadcast_id BIGINT REFERENCES broadcasts(id)` column to
`messages` table when broadcast history becomes important.

---

## 4. Rate Limiter / Metrics — `AgentMetrics` (backend-api-module.js)

Bob's `AgentMetrics` class is **in-memory only** — data lost on restart.

### Schema gap: no request_metrics table

My `tokenfly_core_schema.sql` does not include a metrics persistence table.
Adding one:

```sql
-- Proposed: request_metrics table (not yet in schema)
CREATE TABLE request_metrics (
    id          BIGSERIAL   PRIMARY KEY,
    endpoint    TEXT        NOT NULL,
    method      TEXT        NOT NULL,
    status_code SMALLINT    NOT NULL,
    duration_ms INTEGER     NOT NULL CHECK (duration_ms >= 0),
    client_ip   INET,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_request_metrics_endpoint ON request_metrics (endpoint, recorded_at DESC);
CREATE INDEX idx_request_metrics_recent ON request_metrics (recorded_at DESC);
```

This would let the AgentMetrics module persist to DB on each request instead of
(or in addition to) in-memory tracking. See migration file
`output/migration_002_add_request_metrics.sql`.

---

## 5. Task Comments

Bob's API has **no task comments endpoint**. My schema has a `task_comments`
table. This is forward-looking — no gap to resolve now, but Dave's integration
task (Task 4) should plan for adding `GET/POST /api/tasks/:id/comments`.

---

## 6. Validation Alignment — Bob's Validator vs Schema Constraints

Bob's `Validator.schemas.task`:

```js
{
  title:       { type: "string", required: true,  maxLength: 200 },
  description: { type: "string", required: false, maxLength: 1000 },
  priority:    { type: "string", required: false, enum: ["low","medium","high","critical"] },
  assignee:    { type: "string", required: false, maxLength: 50 },
  status:      { type: "string", required: false, enum: ["open","in_progress","done","blocked"] },
}
```

Schema constraints:
- `tasks.title`: `CHECK (char_length(trim(title)) > 0)` — Bob checks required but not empty-string case. **Gap**: `title = "   "` would pass Bob's validator but fail DB constraint.
- `tasks.priority`: Bob enum matches schema enum exactly. ✅
- `tasks.status`: Bob's enum is missing `in_review` and `cancelled` (in schema). Compatible for now but diverges if schema statuses are used.
- `tasks.description`: Bob maxLength=1000; schema has no max — schema is less restrictive (OK).
- `tasks.assignee`: Bob maxLength=50; schema resolves this as FK, no length constraint on UUID. **Gap**: When migrating, `assignee` moves from name string to UUID.

---

## Migration Checklist (File-Based → PostgreSQL)

Before any migration is executed:

- [ ] Seed `agents` table from `public/team_directory.md`
- [ ] Migrate existing tasks from `task_board.md` (set `completed_at` on done tasks using `updated` date as proxy)
- [ ] Migrate `chat_inbox/` messages — parse filename timestamps and from-suffixes
- [ ] Migrate announcements from `public/announcements/`
- [ ] Migrate mode history from `company_mode.md` switch log
- [ ] Confirm PostgreSQL version with Eve (Infra) — schema targets PG 15+
- [ ] Coordinate with Bob on assignee field migration: name string → UUID FK
- [ ] Coordinate with Dave on integration: update API handlers to use DB queries
- [ ] Add `completed_at` auto-set trigger before enabling done-task constraint

---

## Recommended Schema Additions

1. **`request_metrics` table** — persist Bob's AgentMetrics data (see §4 above)
2. **`broadcasts` table** — track broadcast messages as a first-class entity
3. **`agent_capabilities` table** — role+skill tags for routing logic (future)

These additions will be designed in a `migration_002_*.sql` once the core schema
is approved and deployed.

---

*Schema source: `agents/pat/output/tokenfly_core_schema.sql`*
*API source: `backend/api.js`, `agents/bob/output/backend-api-module.js`*
