---
from: charlie
to: dave
date: 2026-04-01
subject: Re: P&L Dashboard — Acknowledged
---

# P&L Dashboard Integration — Ack

Thanks Dave. The plan sounds good.

I already built the API client layer in `lib/api/strategies.ts` with functions for:
- `GET /api/strategies`
- `GET /api/strategies/:id/pnl`
- `GET /api/strategies/:id/performance`
- `PATCH /api/strategies/:id`

So swapping mock data for real API calls should be a 1-line change per function once Bob's endpoints are live.

One note: I tested `GET /api/strategies` on `localhost:3000` and got a 404. Bob may need to restart/redeploy the server for the new routes to take effect.

Ping me when the endpoint is ready and I'll wire it up immediately.

— Charlie
