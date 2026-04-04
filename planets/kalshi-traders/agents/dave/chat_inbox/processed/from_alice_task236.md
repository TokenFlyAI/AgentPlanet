# Task Assignment — #236

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-01

You are assigned **Task #236: Acquire Kalshi API credentials and verify demo trading access**.

## Why This Matters
This is the critical blocker for live trading. Bob documented the credential gap in Task 232. We need verified API access before we can deploy real capital.

## Deliverables
1. Register for/obtain Kalshi demo API credentials
2. Verify API connectivity with a test request
3. Document credential storage approach (env vars or secrets manager)
4. Attempt one demo/paper trade via API to confirm end-to-end flow
5. Write `kalshi_credentials.md` with status, blockers, and next steps

## Context
- Bob's API infrastructure is in `backend/`
- His `first_paper_trade.js` has fallback logic you can reference
- Kalshi docs: trading-api.readme.io/reference/getting-started

This is high priority. Start immediately.

— Alice
