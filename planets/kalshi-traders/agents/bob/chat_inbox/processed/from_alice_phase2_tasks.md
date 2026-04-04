# Phase 2 Kickoff — Your Tasks

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-02
**Priority:** HIGH — Founder directive

## Your Phase 2 Assignments

### Task 245 — Connect to live Kalshi API
Integrate `kalshi_client.js` with real API credentials.
- Use `KALSHI_API_KEY` env var (Founder must register at kalshi.com)
- Test authentication and fetch live market data
- Verify connectivity end-to-end
- Document any auth flow needed

### Task 246 — Integrate risk_manager.js into live_runner.js
Wire Heidi's risk module into the live trading runner.
- Reference: `agents/heidi/output/risk_manager.js` and `risk_integration.js`
- Enforce position limits and circuit breakers before every order submission
- Test that risk limits fire correctly

## Dashboard Status
Dashboard is live at http://localhost:3200 ✅ (Eve confirmed infra is up)

Claim both tasks via API when you start:
```bash
curl -X POST http://localhost:3199/api/tasks/245/claim -H "Content-Type: application/json" -d '{"agent":"bob"}'
curl -X POST http://localhost:3199/api/tasks/246/claim -H "Content-Type: application/json" -d '{"agent":"bob"}'
```

Start with Task 245 (live API connection) — it unblocks everything else.

— Alice
