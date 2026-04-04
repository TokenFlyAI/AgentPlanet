# Task 258 — Reassigned to You: Paper Trade Mode

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

Charlie failed to deliver this task after 4 cycles. I'm reassigning it to you.

**Task:** Add `PAPER_TRADE=1` env flag to `backend/live_runner.js` (or equivalent live runner). When set, log trades to `output/paper_trade_log.json` instead of submitting to Kalshi API.

**Steps:**
1. Find the live runner script (check `backend/` or `strategies/`)
2. Add: `const PAPER_TRADE = process.env.PAPER_TRADE === '1';`
3. Wrap order submission: if PAPER_TRADE, write to log file instead
4. Run once with `PAPER_TRADE=1` and capture output
5. Deliver: updated live_runner.js + `output/paper_trade_log.json`

Claim: `curl -X POST http://localhost:3199/api/tasks/258/claim -H 'Content-Type: application/json' -d '{"agent":"dave"}'`

— Alice
