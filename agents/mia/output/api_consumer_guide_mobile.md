# Tokenfly API — Mobile Consumer Guide

**Audience**: Judy (Mobile Engineer)
**Base URL**: `http://localhost:3100`
**Version**: 1.0 (reflects backend as of 2026-03-29, sessions 1–8)
**Author**: Mia (API Engineer)

This guide covers the endpoints most relevant to mobile clients, with emphasis on payload efficiency, offline patterns, and mobile-specific concerns.

---

## Mobile-Relevant Endpoints

| Endpoint | Use Case | Response Size |
|----------|----------|---------------|
| `GET /api/dashboard` | Home screen snapshot | ~10–50 KB depending on agent count |
| `GET /api/agents` | Agent list screen | Small (summaries only) |
| `GET /api/agents/:name` | Agent detail screen | Medium (status_md can be large) |
| `GET /api/tasks` | Task board screen | Small–medium |
| `PATCH /api/tasks/:id` | Quick status update | Tiny |
| `GET /api/announcements` | Announcements feed | Small |
| `GET /api/health` | Connection check | Tiny |
| `GET /api/mode` | Mode indicator | Tiny |
| `GET /api/events` | Live updates (SSE) | Long-lived connection |

---

## Payload Efficiency

### Use `/api/dashboard` for home screen
One call returns agents + tasks + mode + activeCount. Avoids 3 parallel calls on app launch.

### Filter tasks on the server
Use query params to reduce payload — don't fetch all tasks and filter client-side:

```
GET /api/tasks?status=open
GET /api/tasks?assignee=alice
GET /api/tasks?status=in_progress
```

### Agent list vs Agent detail
`GET /api/agents` returns lightweight summaries. `GET /api/agents/:name` returns the full `status_md` (can be several KB). Only fetch the detail view when the user taps into a specific agent — don't prefetch all agent details.

---

## Response Shapes

### Agent Summary (`GET /api/agents`)
```json
{
  "agents": [
    {
      "name": "alice",
      "role": "Acting CEO / Tech Lead",
      "status": "running",
      "current_task": "Sprint planning",
      "alive": true,
      "lastSeenSecs": 45,
      "unread_messages": 2
    }
  ]
}
```

Key mobile fields:
- `alive` — pre-computed boolean, use for status indicator
- `lastSeenSecs` — "45s ago" label, already computed
- `unread_messages` — badge count

### Task (`GET /api/tasks`)
Direct array (not wrapped in object):
```json
[
  {
    "id": 1,
    "title": "Implement login endpoint",
    "priority": "high",
    "assignee": "bob",
    "status": "in_progress",
    "created": "2026-03-29",
    "updated": "2026-03-29"
  }
]
```

**Status enum**: `open` | `in_progress` | `done` | `blocked` | `in_review` | `cancelled`
**Priority enum**: `low` | `medium` | `high` | `critical`

---

## Offline Patterns

The API has no built-in offline support or delta sync. For mobile resilience:

1. **Cache `/api/dashboard` response** on successful load. Display cached data if offline.
2. **Queue PATCH/POST** operations when offline. Replay on reconnect.
3. **Use `/api/health`** as a connectivity probe before replaying queued writes.

```
GET /api/health
→ 200 { "status": "ok", "uptime_ms": 3600000 }
→ offline: network error or timeout
```

---

## Live Updates — SSE

`GET /api/events` opens a Server-Sent Events stream. The server pushes a `refresh` event every time agent files change (polled every 3 seconds).

**Mobile consideration**: SSE keeps a persistent connection open. On mobile, close the connection when the app goes to background, and reconnect on foreground:

```
// Pseudocode
onForeground:
  evtSource = new EventSource('/api/events')
  evtSource.onmessage = refreshCurrentScreen()

onBackground:
  evtSource.close()
```

On reconnect, always do a fresh fetch (don't assume the SSE didn't miss events).

---

## Quick Actions

### Mark task done
```
PATCH /api/tasks/42
Body: { "status": "done" }
→ 200 { "ok": true, "id": 42, ... }
```
Backend auto-sets `completed_at`.

### Send message to agent
```
POST /api/agents/alice/message
Body: { "message": "Check this out", "from": "ceo" }
→ 200 { "ok": true, "filename": "..." }
```

### Start/stop an agent
```
POST /api/agents/alice/start   → 200 { "ok": true, "already_running": false }
POST /api/agents/alice/stop    → 200 { "ok": true, "output": "Stopping..." }
```

---

## Rate Limits

| Limit | Applies To |
|-------|------------|
| 120 req/min per IP | All GET endpoints |
| 20 req/min per IP | POST/PATCH/DELETE on write endpoints |

**On 429**: Read `retry_after_ms` field and `Retry-After` header. Implement exponential backoff.

```json
{ "error": "too many requests", "retry_after_ms": 45000 }
```

On mobile, 20 req/min for writes is generous. Rate limit hits should only occur in testing or if the app has a bug causing rapid retries.

---

## Error Handling

All errors:
```json
{ "error": "human-readable message" }
```

| HTTP | Meaning | Mobile UX |
|------|---------|-----------|
| 400 | Invalid input | Inline form error |
| 404 | Not found | Show empty state |
| 413 | Body too large (>512 KB) | Truncate message and retry |
| 429 | Rate limit | Toast + backoff |
| 500 | Server error | Toast + retry option |

---

## Authentication

The API currently has **no authentication**. All endpoints are accessible without credentials. This is appropriate for the internal dev tool context. Do not expose the server publicly without adding authentication first.

Coordinate with Heidi (Security) if mobile access patterns change (e.g., external network access).

---

## Push Notifications

The API has no push notification endpoint. Current live-update mechanism is SSE only (`GET /api/events`). If push notifications are needed for mobile, coordinate with Mia and Heidi to design an appropriate endpoint.

---

## Known Issues / Quirks

| Issue | Detail |
|-------|--------|
| `GET /api/agents/:name` inbox | Returns filename/read flag only — no content (security). Use `GET /api/agents/:name/inbox` for message content. |
| `GET /api/tasks` (server.js) | Direct array, NOT wrapped |
| `GET /api/tasks` (backend/api.js, if used standalone) | Wrapped as `{ tasks: [...] }` |
| Task status field | 6 values including `in_review` and `cancelled` — render all in status picker |

---

## Questions?

Contact Mia (API Engineer) via `agents/mia/chat_inbox/`. Reference this guide's version (1.0) when asking about specific endpoint behavior.
