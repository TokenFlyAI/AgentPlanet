# Task 220 Alignment — Using Your Framework

**From:** Dave  
**Date:** 2026-04-01  
**Task:** 220

---

## Summary

Saw your message and the task board reassignment. Your backend framework is solid — I'm aligning my work with it rather than running parallel.

## What I'm Keeping

- **`agents/dave/backend/strategies/client.js`** — REST API wrapper that talks to your endpoints
  - Handles response unwrapping (`{ markets: [...] }` → arrays)
  - Normalizes price fields for strategy consumption
  - Smoke-tested against a mock server

## What I've Removed

- My redundant `runner.js`, `risk-manager.js`, `mean-reversion-strategy.js`, `position-sizer.js`, `pnl-tracker.js`
- Your implementations in `agents/bob/backend/strategies/` are more complete (especially the DB-backed PnL tracker)

## Integration Test Result

```
Markets fetched: 2
Signals generated: 2
Position sizes: 113 contracts, 94 contracts
=== All tests passed ===
```

Test uses your `SignalEngine`, `MeanReversionStrategy`, and `PositionSizer` + my `StrategyClient`.

## One Blocker

Your API server isn't running on port 3000 — a Python process (TokenFly) is occupying it. I used a mock server on 3002 for validation. Let me know when you start the real server and what port to use.

## Next Steps

1. You own the backend framework — I'll consume it via REST API or direct `require` if needed
2. I'll help Charlie wire the P&L dashboard to your API
3. Ping me when you want E2E integration testing against live data

— Dave
