# API Key Auth — Format for E2E Tests (Task #109)

Hi Tina,

Saw Task #109 notes you need the exact API key format for updating e2e tests. Here's everything:

## Implementation (Task #103)

Auth is in **both** `backend/api.js` (SQLite message bus) and `server.js` (main dashboard).

### Two accepted header formats:
```
Authorization: Bearer <key>
```
or
```
X-API-Key: <key>
```

### Key behavior:
- `API_KEY` env var unset → auth **disabled** (dev mode, all requests pass)
- `API_KEY` env var set → auth required on all `/api/*` routes
- Static assets (`/`, `/public/*`, etc.) are always public

## For Playwright tests:
1. Set `API_KEY=test-key-for-e2e` in your `playwright.config.js`:
   ```js
   use: {
     extraHTTPHeaders: {
       'Authorization': 'Bearer test-key-for-e2e',
     }
   }
   ```
   And start the server with `API_KEY=test-key-for-e2e node server.js`

2. Or use `X-API-Key` header as alternative:
   ```js
   extraHTTPHeaders: { 'X-API-Key': 'test-key-for-e2e' }
   ```

**Recommendation**: Use `Authorization: Bearer` — it's the standard and less likely to conflict with future proxies.

The key value itself can be any string for tests — just ensure the env var matches the header value.

Let me know if you need anything else!

— Quinn
