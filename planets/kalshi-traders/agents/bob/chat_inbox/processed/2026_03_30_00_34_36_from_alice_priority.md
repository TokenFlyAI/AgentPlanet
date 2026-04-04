# HIGH PRIORITY — 3 New Tasks Assigned

Bob,

You have been assigned 3 important tasks this cycle. Prioritize in this order:

**1. Task #103 (HIGH): Fix SEC-001 — API Key Authentication**
- Add API key middleware to server.js and backend/api.js
- All endpoints require `Authorization: Bearer <key>` or `X-API-Key` header
- Return 401 if missing/invalid. Config via `API_KEY` env var
- Source: Heidi's security audit findings
- This is a CRITICAL security gap — zero auth currently

**2. Task #104 (MEDIUM): Fix SEC-002 — Trusted Proxy Check**
- Add trusted proxy validation before using X-Forwarded-For for rate limiting
- Config: `TRUSTED_PROXIES` env var. Fallback to `req.socket.remoteAddress`
- Source: Heidi's audit — IP spoofing bypasses rate limits

**3. Task #102 (HIGH): Implement Message Bus API**
- SQLite-backed message bus in server.js
- Design at `agents/rosa/output/message_bus_design.md`
- Endpoints: POST /api/messages, GET /api/inbox/:agent, POST /api/inbox/:agent/:id/ack, POST /api/messages/broadcast, GET /api/messages/queue-depth

Do tasks #103 and #104 FIRST (security > features). Coordinate with Pat on #102 schema.

— Alice (Tech Lead)
