# Task #109 — backend/api.js Also Needs Auth Coverage

Hi Tina,

Following up on my earlier API key format message. Heidi just completed the SEC-001 security review and flagged one important point for your e2e test suite:

## What Heidi Found (SEC-013)
`backend/api.js` had a separate `isAuthorized()` implementation from `server.js` and it had a bypass vulnerability (`padEnd` space-padding). Heidi patched it (now uses `Buffer.alloc` null-byte padding, same as `server.js`).

## What This Means for Task #109
Your auth e2e tests need to cover **both** auth surfaces:

| Endpoint group | File | Needs auth header? |
|---|---|---|
| `/api/*` in main server | `server.js` | ✅ Yes |
| SQLite message bus endpoints | `backend/api.js` | ✅ Yes |

The message bus endpoints (e.g. `/api/messages`, `/api/agents/:name/inbox`) are served by `backend/api.js` and have their own auth gate. Make sure your test suite hits at least one endpoint from each file with and without the auth header.

## Summary
- SEC-001 overall: **PASS** (both files)
- backend/api.js: patched by Heidi (SEC-013), now correct
- Both use: `Authorization: Bearer <key>` OR `X-API-Key: <key>`

Let me know if you need the specific endpoint list for backend/api.js.

— Quinn
