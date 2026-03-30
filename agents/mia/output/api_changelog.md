# Tokenfly API — Changelog

**API Engineer**: Mia
**Last Updated**: 2026-03-30

---

## v1.1.0 — 2026-03-29

### Breaking Changes

#### `GET /api/agents/:name` — Inbox field is now metadata-only
**Impact**: API consumers reading `inbox[].content` will get `undefined`.

**Before (v1.0)**:
```json
{
  "inbox": [
    { "filename": "2026_03_29_from_ceo.md", "content": "...", "unread": true }
  ]
}
```

**After (v1.1)**:
```json
{
  "inbox": [
    { "file": "2026_03_29_from_ceo.md", "read": false }
  ]
}
```

**Reason**: Security fix QI-003. The inbox previously exposed full CEO message content to unauthenticated callers. Now only filename and read-status are returned.

**Migration**: If you need to read inbox message content, use `GET /api/agents/:name/inbox` (server.js endpoint, returns full content).

---

#### `GET /api/agents` and `GET /api/agents/:name` — Response shape changed
**Impact**: Code checking `agent.status === "running"` will break.

**Before (v1.0)**:
```json
{ "name": "alice", "status": "running", "role": "...", "cycles": 5, "lastSeenSecs": 30 }
```

**After (v1.1)** (backend/api.js):
```json
{ "name": "alice", "alive": true, "heartbeat_at": "2026-03-29T22:00:00Z", "current_task": "...", "unread_messages": 2 }
```

**Migration**: Check `agent.alive` (boolean) instead of `agent.status === "running"`.
Note: The dashboard server (server.js) may enrich these fields when serving the frontend.

---

### Non-Breaking Changes

#### `POST /api/tasks` — Stricter title validation
- Whitespace-only titles (e.g. `"   "`) now return `400 { "error": "title is required" }`.
- Invalid `priority` values return `400 { "error": "priority must be one of: low, medium, high, critical" }`.
- **Response body changed**: now returns the full created task object (not `{ ok, id }`).

#### `PATCH /api/tasks/:id` — Enum validation + new status values
- **New status values**: `in_review` and `cancelled` are now valid.
- Invalid `status` values return `400 { "error": "status must be one of: ..." }`.
- Invalid `priority` values return `400 { "error": "priority must be one of: ..." }`.
- **Response body changed**: now returns the full updated task object (not `{ ok: true }`).
- When `status` transitions to `done`, a `completed_at` timestamp is auto-set.

#### `DELETE /api/tasks/:id` — Response body changed
- **Response body changed**: now returns `{ "deleted": { ...task } }` (not `{ ok: true }`).

#### `GET /api/tasks` — Query filter support
- New query parameters: `?assignee=<name>` and `?status=<value>` (case-insensitive).
- Example: `GET /api/tasks?assignee=bob&status=open`

#### `GET /api/health` — Response shape depends on handler
- **backend/api.js**: `{ "status": "ok", "uptime_ms": 3600000 }`
- **server.js**: `{ "uptime": 3600, "memory": {...}, "activeAgents": 3, "sseClients": 1 }`

---

## v1.0.0 — 2026-03-29 (initial release)

Initial API surface covering:
- Agent status and detail endpoints
- Task board CRUD
- Messaging (direct agent messages, broadcast)
- Announcements and team channel
- CEO inbox
- Search
- Server health and config

See `api_reference.md` for full endpoint documentation.

---

## Migration Guide

### v1.0 → v1.1

1. **Agent listing** (`GET /api/agents`): Replace `agent.status === "running"` checks with `agent.alive === true`.
2. **Agent inbox** (`GET /api/agents/:name`): Remove any code reading `inbox[].content`. Use `GET /api/agents/:name/inbox` if you need full message content.
3. **Task creation** (`POST /api/tasks`): Update response handling — response is now a full `Task` object, not `{ ok, id }`.
4. **Task updates** (`PATCH /api/tasks/:id`): Update response handling — response is now a full `Task` object.
5. **Task deletion** (`DELETE /api/tasks/:id`): Update response handling — response is now `{ deleted: Task }`.
6. **Task status field**: Add support for `in_review` and `cancelled` status values in any UI or validation logic.

---

## v1.2.0 — 2026-03-30

### New Endpoints

#### `GET /api/agents/:name/ping`
Check whether an agent's OS process is running. Returns real-time process status via `pgrep`.

**Response**:
```json
{ "name": "alice", "running": true, "inCycle": false, "pids": ["12345"] }
```
| Field | Description |
|-------|-------------|
| `running` | `true` if `run_subset.sh <name>` is running |
| `inCycle` | `true` if `run_agent.sh <name>` is actively in a cycle |
| `pids` | All matching process IDs |

### Changes to Existing Endpoints

#### `GET /api/agents` — Full AgentSummary fields + clarified response shape
- **Clarification**: `server.js` returns a **plain array** `[{...}]`. (`backend/api.js` returns `{ agents: [...] }` — these are different.)
- **New field**: `auth_error` (boolean) — `true` if agent's `last_context.md` contains auth/login failure indicators.
- **New field** (reminder): `status` — agent status string (`running`, `idle`, `stopped`, `error`, `unknown`).

**Full v1.2 AgentSummary shape**:
```json
{
  "name": "alice",
  "role": "Acting CEO / Tech Lead",
  "status": "running",
  "current_task": "Reviewing PR #42",
  "cycles": 12,
  "last_update": "2026-03-29T21:00:00.000Z",
  "lastSeenSecs": 45,
  "heartbeat_age_ms": 45000,
  "auth_error": false,
  "alive": true,
  "unread_messages": 2
}
```

#### `GET /api/agents/:name/cycles` — Sequential `cycle` field
Each cycle object now includes a `cycle` field (1-based integer, oldest first) for stable reference in `GET /api/agents/:name/cycles/:n`.

### Migration Guide: v1.1 → v1.2

1. **Agent listing** (`GET /api/agents`): If parsing the response as `{ agents: [...] }`, switch to treating the response as a plain array.
2. **Agent health check**: Use new `GET /api/agents/:name/ping` instead of relying on heartbeat age for real-time process status.
3. **Auth error monitoring**: Read `auth_error` field from agent summaries to detect agents that failed to authenticate.

---

## v1.3 — OpenAPI Spec Completion (Session 11, 2026-03-30)

### New: Missing Endpoints Documented in openapi.yaml

The following server.js endpoints were previously undocumented in `openapi.yaml`. All have been added:

#### `POST /api/agents/watchdog`
Checks all running agents for stale heartbeats (>15 min). Restarts stuck agents automatically. Response includes list of restarted agents and per-agent action details.

#### `POST /api/tasks/{id}/claim`
Atomic task claim with file locking. Sets task to `in_progress` and assigns to the requesting agent. Returns 409 if already claimed by another agent. Agents should prefer this over manual PATCH for concurrent claim safety.

#### `GET /api/mode` / `POST /api/mode`
Get or set company operating mode (`plan`, `normal`, `crazy`). POST calls `switch_mode.sh` internally.

#### `GET /api/cost`
Returns today's token spend and 7-day totals broken down per agent. Fields: `today_usd`, `today_cycles`, `total_7d_usd`, `total_7d_cycles`, `per_agent[]`.

#### `GET /api/metrics`
System-wide health snapshot: task completion stats (by_status, by_priority, by_assignee, completion_rate_pct), agent health (running/idle/stale counts), 7-day cost/cycle stats, and HTTP request metrics from Bob's middleware.

#### `POST /api/messages/{agent}`
Send a direct message to any agent's inbox. Part of `backend/api.js`. Was in `api_reference.md` but missing from OpenAPI spec.

### New Tags Added
- `Configuration` — mode management endpoints
- `Stats` — cost and metrics endpoints
- `Messaging` — direct agent messaging

### No Breaking Changes
All additions are net-new documentation. No existing endpoint behavior has changed.

## v1.4 — API Reference Completion (Session 12, 2026-03-30)

### Newly Documented Endpoints

The following endpoints existed in `server.js` but were missing from `api_reference.md`. All have been added in this session:

#### Agent Lifecycle
- `POST /api/agents/watchdog` — restart stuck agents (stale heartbeat >15 min); response includes per-agent action details
- `GET /api/watchdog-log` — in-memory watchdog event log
- `GET /api/agents/:name/log/stream` — SSE live log tail (Server-Sent Events); last 20 KB on connect, then new lines as they arrive

#### Agent Persona
- `POST /api/agents/:name/persona/note` — append free-form note to persona evolution log
- `PATCH /api/agents/:name/persona` — append structured evolution observation to persona

#### Agent Cycle History
- `GET /api/agents/:name/cycles` — today's cycle summaries (newest first): n, started/ended, turns, cost_usd, duration_s, action_count, preview
- `GET /api/agents/:name/cycles/:n` — full raw log content for cycle N

#### Task Management
- `POST /api/tasks/:id/claim` — atomic claim with file lock; 409 if claimed by another agent
- `GET /api/tasks/:id/result` — fetch task result file (shared task_outputs/ or agent output/)
- `POST /api/tasks/:id/result` — write task result to public/task_outputs/task-{id}-{slug}.md

#### CEO Command
- `POST /api/ceo/command` — smart routing: @mention → DM, `task:` → create task, `/mode` → switch mode, else → alice inbox

#### Consensus Board
- `GET /api/consensus` — return parsed consensus board entries + raw markdown
- `POST /api/consensus/entry` — add entry (type + content required; section defaults to "Evolving Relationships")

### No Breaking Changes
All additions are net-new documentation. No endpoint behavior has changed.
