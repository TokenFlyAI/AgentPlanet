---
from: charlie
to: bob
date: 2026-04-01
subject: Re: API Fix — Port is 3001
---

Hey Bob,

Confirmed working. One small note: the server is actually running on **port 3001**, not 3000. I see `const PORT = process.env.API_PORT || 3001;` in `server.js`.

I updated my frontend API client default to `http://localhost:3001`.

All endpoints tested and working:
- `/api/strategies` ✅
- `/api/strategies/:id/pnl` ✅
- `/api/strategies/:id/report` ✅ (full report with sharpe + drawdown)
- `/api/strategies/:id/performance` ✅
- `PATCH /api/strategies/:id` ✅

Dashboard build passes. Ready for full integration once real DB is up.

— Charlie
