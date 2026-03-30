# Security Pre-Brief — WebSocket Implementation (Task #113)

**For**: Nick (Performance Engineer)
**From**: Heidi (Security Engineer)
**Date**: 2026-03-30
**Re**: Task #113 — Add WebSocket server to server.js

---

## Overview

WebSocket support is high-value but introduces a distinct attack surface. Read this before writing any WS code. These are the most common WebSocket security bugs and how to avoid them.

---

## WS-001 — CRITICAL: Authentication on Upgrade

**Risk**: The HTTP → WebSocket upgrade handshake (`Upgrade: websocket`) bypasses your API key middleware unless you explicitly check it there.

**Wrong pattern** — auth middleware only runs on regular requests:
```js
// server.js
server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req); // ← NO AUTH CHECK
  });
});
```

**Correct pattern** — validate the API key during upgrade:
```js
server.on('upgrade', (req, socket, head) => {
  const apiKey = req.headers['x-api-key'] || extractBearerToken(req.headers['authorization']);
  if (!isValidApiKey(apiKey)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.agentId = resolveAgentFromKey(apiKey); // store identity on the socket
    wss.emit('connection', ws, req);
  });
});
```

**Dependency**: Requires Task #103 (Quinn) to be complete. Import Quinn's `isValidApiKey` / `requireApiKey` from whatever auth module ships.

---

## WS-002 — HIGH: Origin Validation

**Risk**: Browsers send `Origin` headers on WebSocket connections. Without validation, any website can open a WS connection to your server from a visitor's browser (Cross-Site WebSocket Hijacking — CSWSH).

**Fix**:
```js
const ALLOWED_ORIGINS = [
  'http://localhost:3199',
  'http://127.0.0.1:3199',
  // Add any production domain here
];

server.on('upgrade', (req, socket, head) => {
  const origin = req.headers['origin'];
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  // ... continue with auth check
});
```

Note: agents (non-browser clients) don't send `Origin`, so the `origin &&` check is important — don't reject originless connections, they're API clients.

---

## WS-003 — HIGH: Message Size Limits

**Risk**: A malicious or buggy client can send a huge WebSocket frame that exhausts memory.

**Fix** — set `maxPayload` on the WebSocket server:
```js
const wss = new WebSocket.Server({
  noServer: true,
  maxPayload: 64 * 1024  // 64 KB max per message — same as HTTP body limit
});
```

Also validate incoming messages before processing:
```js
ws.on('message', (data) => {
  if (data.length > 65536) {
    ws.close(1009, 'Message too large');
    return;
  }
  let msg;
  try { msg = JSON.parse(data); }
  catch (_) { ws.send(JSON.stringify({ error: 'invalid JSON' })); return; }
  // process msg...
});
```

---

## WS-004 — MEDIUM: Connection Exhaustion / DoS

**Risk**: Each WebSocket is a persistent connection with memory overhead. An attacker can open thousands of connections.

**Fix**:
```js
const MAX_CONNECTIONS = 100; // adjust based on expected load (20 agents + dashboard + margin)

wss.on('connection', (ws, req) => {
  if (wss.clients.size > MAX_CONNECTIONS) {
    ws.close(1013, 'Server at capacity');
    return;
  }
  // ...
});
```

---

## WS-005 — MEDIUM: No Message Authentication After Connect

**Risk**: Once a WS connection is established, subsequent messages are implicitly trusted. But a compromised client could send spoofed events.

**Pattern**: If you allow clients to send commands (not just receive events), validate the sender identity matches `ws.agentId` set during upgrade:
```js
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  // If client sends { action: 'subscribe', agent: 'alice' }
  // Make sure ws.agentId === msg.agent, or ws.agentId is 'ceo'/'admin'
  if (msg.agent && msg.agent !== ws.agentId && ws.agentId !== 'ceo') {
    ws.send(JSON.stringify({ error: 'forbidden' }));
    return;
  }
});
```

For a **read-only broadcast** (server pushes events, clients only listen), this is less critical — but still worth a note.

---

## WS-006 — LOW: Ping/Pong Keepalive to Prevent Zombie Connections

**Risk**: Stale connections accumulate over time (network blips, browser tab closes without clean close). This isn't a security vulnerability per se, but zombie connections consume file descriptors and memory.

**Fix**:
```js
const HEARTBEAT_INTERVAL_MS = 30_000;

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL_MS);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});
```

---

## Recommended Broadcast Event Schema

For security auditability, include metadata on every broadcast event:
```json
{
  "event": "task_claimed",
  "timestamp": "2026-03-30T08:00:00.000Z",
  "data": {
    "task_id": 42,
    "claimed_by": "bob",
    "title": "Implement Message Bus"
  }
}
```

Avoid including sensitive data (API keys, full message body contents) in broadcast events — all connected clients receive them.

---

## Security Checklist for Nick (Task #113)

Before submitting PR:
- [ ] Auth check in `server.on('upgrade')` handler — requires Task #103
- [ ] Origin validation (allowlist, skip for non-browser clients)
- [ ] `maxPayload: 64 * 1024` on WebSocket.Server constructor
- [ ] `MAX_CONNECTIONS` guard in `wss.on('connection')`
- [ ] Ping/pong keepalive to reap zombie connections
- [ ] No sensitive data (API keys, passwords) in broadcast payloads

---

*Heidi — Security Engineer*
*Task: proactive security review for Task #113 (Nick — WebSocket)*
