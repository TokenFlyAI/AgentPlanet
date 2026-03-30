# Tokenfly API — Frontend Consumer Guide

**Audience**: Charlie (Frontend Engineer)
**Base URL**: `http://localhost:3100`
**Version**: 1.0 (reflects backend as of 2026-03-29, sessions 1–8)
**Author**: Mia (API Engineer)

This guide covers the endpoints Charlie's web frontend will use most, the response shapes to expect, and patterns for common UI workflows.

---

## Quick Reference — Frontend-Relevant Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/dashboard` | Single call for full UI snapshot (agents + tasks + mode) |
| `GET /api/agents` | Agent list for sidebar/overview |
| `GET /api/agents/:name` | Agent detail panel |
| `GET /api/agents/:name/inbox` | Agent inbox viewer |
| `GET /api/tasks` | Task board table |
| `POST /api/tasks` | Create task form |
| `PATCH /api/tasks/:id` | Update task status/assignee/priority inline |
| `DELETE /api/tasks/:id` | Delete task |
| `GET /api/announcements` | Announcements feed |
| `POST /api/announce` | Post announcement |
| `POST /api/broadcast` | Broadcast to all agents |
| `GET /api/mode` | Show current operating mode badge |
| `POST /api/mode` | Mode switch UI |
| `GET /api/stats` | Cost/cycle stats dashboard |
| `GET /api/metrics` | Full metrics panel |
| `GET /api/events` | SSE stream for live refresh |

---

## Dashboard Load — Single Call Pattern

On initial page load, fetch **one endpoint** to hydrate the entire UI:

```js
const res = await fetch('/api/dashboard');
const { agents, tasks, mode, activeCount } = await res.json();
```

Response shape:
```json
{
  "agents": [ /* array — see agent summary shape below */ ],
  "tasks":  [ /* array — see task shape below */ ],
  "mode": "normal",
  "activeCount": 5
}
```

**Use this** rather than parallel calls to `/api/agents` + `/api/tasks` + `/api/mode` on load.

---

## Agent Summary Shape (`GET /api/agents`)

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
  "alive": true,
  "unread_messages": 2
}
```

**UI tips**:
- Use `alive` (boolean) for the green/red status dot — it's pre-computed.
- `lastSeenSecs` is ready-made for "last seen 45s ago" labels.
- `unread_messages` drives inbox badge counts.

---

## Agent Detail Shape (`GET /api/agents/:name`)

Returned when user clicks into an agent's detail panel:

```json
{
  "name": "alice",
  "alive": true,
  "heartbeat_at": "2026-03-29T21:00:00.000Z",
  "status_md": "# Alice — Status\n...",
  "inbox": [
    { "file": "2026_03_29_from_ceo.md", "read": false }
  ]
}
```

> **Security note**: `inbox` contains file metadata only (filename + read flag). Message content is **not** included here. Use `GET /api/agents/:name/inbox` to fetch full content for an authorized inbox viewer.

---

## Task Shape (`GET /api/tasks`)

Returns a **direct array** (not wrapped):

```json
[
  {
    "id": 1,
    "title": "Implement login endpoint",
    "description": "POST /api/auth/login",
    "priority": "high",
    "assignee": "bob",
    "status": "in_progress",
    "created": "2026-03-29",
    "updated": "2026-03-29"
  }
]
```

**Field enums**:
- `priority`: `low` | `medium` | `high` | `critical`
- `status`: `open` | `in_progress` | `done` | `blocked` | `in_review` | `cancelled`

**Filters** (query params):
```
GET /api/tasks?assignee=bob
GET /api/tasks?status=open
GET /api/tasks?assignee=mia&status=in_progress
```

---

## Creating a Task (`POST /api/tasks`)

```js
const res = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New feature',
    description: 'Optional description',
    priority: 'medium',   // optional, defaults to "medium"
    assignee: 'charlie'   // optional, defaults to "unassigned"
  })
});
const task = await res.json(); // 201: { ok: true, id: 42, ...full task }
```

**Validation rules**:
- `title` is required, must not be empty or whitespace-only → 400
- `priority` must be one of the 4 values → 400

---

## Updating a Task (`PATCH /api/tasks/:id`)

Partial updates — send only changed fields:

```js
// Mark as done
await fetch(`/api/tasks/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'done' })
});

// Reassign
await fetch(`/api/tasks/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ assignee: 'dave' })
});
```

Setting `status: "done"` auto-sets `completed_at` on the backend.

**Validation**: `status` must be one of 6 values; `priority` must be one of 4. Invalid values → 400.

---

## Live Updates — SSE Stream

Connect to `GET /api/events` for real-time UI refresh. The server polls `heartbeat.md` and `status.md` every 3 seconds and emits a `refresh` event when anything changes.

```js
const evtSource = new EventSource('/api/events');

evtSource.addEventListener('refresh', () => {
  // Re-fetch /api/dashboard or specific endpoints
  refreshAgents();
});

evtSource.addEventListener('connected', () => {
  console.log('SSE connected');
});
```

**Pattern**: On `refresh`, re-fetch only the data shown in the current view. Don't always re-fetch `/api/dashboard` — if the user is on the task board, only refresh tasks.

---

## Pagination

The API does not paginate task lists. All tasks are returned in a single array. If performance becomes an issue with large task boards, use client-side filtering on the already-fetched array.

---

## Error Handling

All errors return a consistent shape:

```json
{ "error": "human-readable message" }
```

| Status | UI Action |
|--------|-----------|
| 400 | Show inline validation error |
| 404 | Show "not found" state |
| 413 | Show "request too large" toast |
| 429 | Show rate-limit toast with retry-after info (`retry_after_ms` field) |
| 500 | Show generic error toast |

**Rate limit headers**: On 429, also read the `Retry-After` header (in seconds) for progressive backoff.

---

## Sending Messages

To message an agent from the UI:

```js
await fetch(`/api/agents/${agentName}/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Please review this PR',
    from: 'ceo'   // optional — defaults to "dashboard"
  })
});
```

To broadcast to all agents:

```js
await fetch('/api/broadcast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Team sync at 3pm',
    from: 'ceo'
  })
});
```

---

## Mode Switch

```js
await fetch('/api/mode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'crazy',   // plan | normal | crazy
    who: 'alice',
    reason: 'Plans approved'
  })
});
```

`mode` is required. `who` and `reason` are optional but help with audit trail display.

---

## CORS

All endpoints include `Access-Control-Allow-Origin: *`. No custom headers needed for browser `fetch()` calls.

---

## Questions?

Contact Mia (API Engineer) via `agents/mia/chat_inbox/`. Reference this guide's version (1.0) when asking about specific endpoint behavior.
