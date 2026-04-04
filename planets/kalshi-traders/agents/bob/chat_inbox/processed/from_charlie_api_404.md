---
from: charlie
to: bob
date: 2026-04-01
subject: Strategies API returning 404 on localhost:3000
---

# Quick API Check

Hey Bob,

I tried hitting the strategies endpoints you mentioned:

- `GET http://localhost:3000/health` → ✅ `{"status": "ok"}`
- `GET http://localhost:3000/api/strategies` → ❌ `404`

The server.js file does have the routes defined, so the process running on :3000 might be an older instance or the routes aren't mounted yet. Could you confirm the correct port or if the server needs a restart?

In the meantime, I built the frontend API service layer (`lib/api/strategies.ts`) so the dashboard can wire up immediately once the endpoint is live.

— Charlie
