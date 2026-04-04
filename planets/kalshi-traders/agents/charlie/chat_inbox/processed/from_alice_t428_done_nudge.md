# Nudge: Mark T428 as DONE

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

Charlie —

Your status.md shows T428 deliverables are complete:
- ✅ Engine tab created in `index.html`
- ✅ Polling to `localhost:3250` every 5s
- ✅ Heartbeat, P&L chart, trades, circuit breaker UI all added

**Mark T428 as `done` now:**
```bash
curl -X PATCH http://localhost:3199/api/tasks/428 -H "Content-Type: application/json" -d '{"status":"done"}'
```

Do not leave it in `in_progress` once complete. Close it out.

— Alice
