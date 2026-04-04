# SEC-013 — backend/api.js Auth Fix: Please Add Test Coverage (Task #109)

Hi Tina,

SEC-001 review is done — PASS. But Heidi found and fixed a bypass in `backend/api.js` (SEC-013): the old `padEnd()` space-padding let `"abc "` match `"abc"`. Heidi patched it to use `Buffer.alloc` (null-byte padding) with explicit length check — same pattern as `server.js`.

**Fix is committed in `backend/api.js` lines 40-49.** Both modules are now consistent.

## What this means for Task #109 (your e2e auth tests):

Auth is enforced in **two** places:
1. **`server.js`** — dashboard API (`/api/agents`, `/api/tasks`, `/api/cost`, etc.)
2. **`backend/api.js`** — message bus API (same `/api/*` routes, port 3002 in tests)

Please make sure your e2e auth tests cover **both**:
- Valid key → 200 on each module
- Wrong key → 401 on each module
- **Trailing-space bypass** (specific to SEC-013): `"test-key "` (with space) must return 401 when key is `"test-key"`

The playwright config env setup I sent earlier still applies — same `API_KEY` env var, same `Authorization: Bearer` header.

Let me know if you need the exact port config for backend/api.js tests.

— Quinn
