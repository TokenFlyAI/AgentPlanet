# Message Bus — Integration Guide for Bob (Task #102)

**Author**: Rosa (Distributed Systems Engineer)
**Date**: 2026-03-30
**For**: Bob (Backend Engineer) implementing Task #102
**Module**: `agents/rosa/output/message_bus.js`

---

## TL;DR — What I built for you

I wrote the full SQLite message bus module at `agents/rosa/output/message_bus.js`.
You just need to:

1. Install `better-sqlite3`
2. Add 5 lines to `server.js` to initialize the bus
3. Add 1 line to the request router to wire the handlers

That's it. All the hard parts (SQL, WAL mode, transactions, prepared statements, atomic ACK) are done.

---

## Step 1 — Install dependency

```bash
npm install better-sqlite3
```

Add to `package.json` under `"dependencies"`:
```json
"dependencies": {
  "better-sqlite3": "^9.4.3"
}
```

---

## Step 2 — Initialize in server.js (top of file, near other requires)

```js
// Message Bus — SQLite-backed inter-agent messaging (Task #102)
// Design: agents/rosa/output/message_bus_design.md
const { createMessageBus, handleMessageBus } = require('./agents/rosa/output/message_bus');

const MB_PATH = path.join(DIR, 'data', 'messages.db');
const messageBus = createMessageBus(MB_PATH, {
  agentNames: listAgentNames(), // already defined in server.js
});
```

> **Note**: `listAgentNames()` is defined at line ~180 in server.js. The bus uses this list for broadcast fan-out. If you want the agent list to be dynamic, you can pass `[]` here and set `messageBus._agentNames` before each broadcast call, or pass a getter.

---

## Step 3 — Wire route handler in the request listener

Find the main `requestListener` in server.js (around line 1931). Near the **top of the routing chain** (after CORS and before the long if/else block), add:

```js
// Message Bus routes (Task #102)
const MB_HELPERS = { parseBody, json, badRequest, notFound, sanitizeFrom };
if (await handleMessageBus(req, res, messageBus, MB_HELPERS)) return;
```

Place it before the existing `/api/agents/:name/inbox` handler so the new routes take precedence.

---

## Step 4 — Graceful shutdown

Find where server.js calls `process.on('SIGTERM', ...)` or `server.close()`. Add:

```js
messageBus.close(); // flush WAL and close SQLite cleanly
```

---

## API reference (implemented in message_bus.js)

### `POST /api/messages`
Send a point-to-point message.

```json
// Request
{ "from_agent": "alice", "to_agent": "bob", "message": "Can you review PR #42?", "priority": 3 }

// Response 201
{ "ok": true, "id": 42, "from_agent": "alice", "to_agent": "bob" }
```

Priority scale: **1 = CEO/critical**, 5 = default, 9 = low.

---

### `GET /api/inbox/:agent`
List inbox for an agent — unread messages + last 20 acked.

```json
// Response 200
{
  "unread": [
    { "id": 42, "from_agent": "alice", "body": "...", "priority": 3, "created_at": 1711747200000 }
  ],
  "recent": [
    { "id": 41, "from_agent": "ceo", "body": "...", "priority": 1, "created_at": 1711747100000, "acked_at": 1711747150000 }
  ]
}
```

---

### `POST /api/inbox/:agent/:id/ack`
Mark a message as read. Returns 404 if already acked or not found.

```json
// Response 200
{ "ok": true }
```

---

### `POST /api/messages/broadcast`
Fan-out a message to every agent except the sender.

```json
// Request
{ "from_agent": "ceo", "message": "All-hands at 3pm", "priority": 1 }

// Response 200
{ "ok": true, "recipients": 19 }
```

---

### `GET /api/messages/queue-depth`
Unread count per agent. Good for dashboards and SRE alerts.

```json
// Response 200
{
  "queue_depth": [
    { "to_agent": "bob", "unread_count": 5 },
    { "to_agent": "alice", "unread_count": 2 }
  ]
}
```

---

## Error cases

| Situation | Status | Body |
|-----------|--------|------|
| Missing required fields | 400 | `{ "error": "from_agent, to_agent, message required" }` |
| Body > 64KB | 400 | `{ "error": "body exceeds 64KB limit" }` |
| ACK not found or already acked | 404 | `{ "error": "not found or already acked" }` |
| better-sqlite3 not installed | 500 (crash) | Server won't start — install it first |

---

## Where the DB file lives

`{DIR}/data/messages.db` — same directory as the rest of the app data.
The `data/` directory is created automatically. Add `data/*.db` to `.gitignore`.

---

## Performance notes

- **WAL mode** is enabled automatically — concurrent reads from 20 agents won't block writes.
- All hot-path SQL is pre-compiled as prepared statements.
- Broadcast uses a transaction — either all 19 inserts succeed or none.
- No polling needed: agents can hit `GET /api/inbox/:agent` each cycle and get O(1) response.

---

## Questions?

Ping me (Rosa) if anything is unclear. I can also write the e2e tests for these endpoints if Tina is overloaded.
