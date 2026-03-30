# WebSocket Architecture — Task #113 Design Notes for Nick

**From**: Rosa (Distributed Systems)
**For**: Nick (Performance) — Task #113
**Date**: 2026-03-30

## TL;DR

Use the `ws` npm package. Upgrade the existing `http.createServer` server. Maintain a `Set<WebSocket>` of live connections. Emit events from 5 hook points in server.js. Client reconnects with exponential backoff.

---

## Architecture Overview

```
server.js
   ├── http.createServer(handler)
   ├── WebSocketServer({ server })       ← attach to same port
   ├── wsClients: Set<ws>                ← live connection registry
   └── broadcast(type, data)             ← fan-out helper

Events emitted:
  task_claimed     → POST /api/tasks/:id/claim  (line ~1407)
  task_updated     → PATCH /api/tasks/:id        (line ~1321)
  task_created     → POST /api/tasks             (line ~1291)
  heartbeat_update → GET /api/agents (on each poll, or file watcher)
  mode_change      → POST /api/mode              (line ~1554 area)
```

---

## Implementation Plan

### 1. Install `ws`

```bash
npm install ws
```

Add to server.js top:
```js
const { WebSocketServer } = require('ws');
```

### 2. Attach WS Server to Existing HTTP Server

```js
// After: const server = http.createServer(...)
const wss = new WebSocketServer({ server });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
  ws.on('error', () => wsClients.delete(ws));
  // Send current state snapshot on connect
  ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
});

function wsBroadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  for (const client of wsClients) {
    if (client.readyState === 1) {  // OPEN
      try { client.send(msg); } catch (_) { wsClients.delete(client); }
    }
  }
}
```

### 3. Hook Points in server.js

Add `wsBroadcast()` calls at these 5 locations:

| Event | Location | Payload |
|-------|----------|---------|
| `task_claimed` | Line ~1440 (after successful claim write) | `{ id, agent, status: 'in_progress' }` |
| `task_updated` | Line ~1321 (after PATCH /api/tasks/:id) | `{ id, changes }` |
| `task_created` | Line ~1315 (after POST /api/tasks) | `{ task }` |
| `task_deleted` | DELETE /api/tasks/:id handler | `{ id }` |
| `mode_change` | POST /api/mode handler | `{ mode, reason }` |

For heartbeat updates — **use a file watcher**, not polling:

```js
// Watch heartbeat files — fire when any agent updates its heartbeat
const hbWatcher = fs.watch(EMPLOYEES_DIR, { recursive: true }, (event, filename) => {
  if (filename && filename.endsWith('heartbeat.md')) {
    const agentName = filename.split(path.sep)[0];
    wsBroadcast('heartbeat_update', { agent: agentName, ts: Date.now() });
  }
});
```

This is O(1) vs O(agents) polling — critical for token/CPU efficiency.

### 4. Client-Side (index_lite.html)

```js
function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}`);

  ws.onmessage = (e) => {
    const { type, data } = JSON.parse(e.data);
    if (type === 'task_claimed' || type === 'task_updated' || type === 'task_created') {
      refreshTasks();   // existing fetch-and-render function
    }
    if (type === 'heartbeat_update') {
      refreshAgents();  // existing agent list refresh
    }
    if (type === 'mode_change') {
      updateModeDisplay(data.mode);
    }
  };

  ws.onclose = () => {
    // Exponential backoff reconnect: 1s, 2s, 4s, 8s, max 30s
    const delay = Math.min(30000, (connectWS._delay || 1000));
    connectWS._delay = delay * 2;
    setTimeout(() => { connectWS._delay = 1000; connectWS(); }, delay);
  };

  ws.onerror = () => ws.close();  // triggers onclose → reconnect
}

connectWS();
// Remove existing setInterval polling once WS is confirmed working
```

---

## Distributed Systems Concerns

### Connection State
- **Single-process model**: `wsClients` Set is in-memory. Fine for single Node.js process.
- **If multi-process ever needed**: Move to Redis pub/sub (not needed now — overkill).

### Delivery Guarantee
- **At-most-once** delivery. WebSocket frames are not acknowledged. Dashboard just re-polls on reconnect — eventual consistency is fine for a UI.
- **No message queue needed** — clients get current state on reconnect via existing REST calls.

### Back-pressure
- Server doesn't buffer for slow clients. If `client.send()` throws, remove from set.
- With ≤20 agents generating events, fan-out to ≤10 browser tabs is trivial.

### Reconnection
- Client-side exponential backoff (shown above) handles server restarts gracefully.
- Heartbeat ping/pong not required for intranet dashboard — TCP keepalive sufficient.

### Security Note
- **No auth on WS connection** until Task #103 (SEC-001) ships.
- After Quinn's auth lands: check `Authorization` header in `wss.on('connection', (ws, req) => ...)` using `req.headers['authorization']` or cookie.

---

## Integration with Existing Polling

Don't remove polling immediately — run both for one cycle, then remove:

```js
// index_lite.html — phase-out plan
// Phase 1: WS live, polling still runs (current cycle)
// Phase 2: Remove setInterval for agents/tasks once WS confirmed stable
// Phase 3 (optional): Keep a 60s fallback poll as circuit breaker
```

---

## Testing

After implementation, verify:
1. Open dashboard in 2 browser tabs
2. Claim a task via `curl POST /api/tasks/:id/claim?agent=nick`
3. Both tabs should update within ~100ms (no manual refresh)
4. Kill server, verify tabs show reconnecting state, verify they recover

---

## Questions / Open Items

- **Nick**: Does `index_lite.html` currently have named functions like `refreshTasks()` / `refreshAgents()`, or is it inline? If inline, refactor into named functions first.
- **Quinn** (Auth, Task #103): WS auth — should we use same `X-API-Key` header or cookie-based? Clarify before adding auth to WS handshake.

— Rosa
