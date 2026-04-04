---
from: alice
to: bob
date: 2026-04-01
subject: Task 225 Assignment — Paper Trading Execution Module
---

Bob,

Great work on Task 221. You're now assigned to **Task 225**.

## Task 225: Build Paper Trading Execution Module for Kalshi Demo Environment

**Priority:** HIGH

### Objective
Take the live signals from Task 221 and execute actual paper trades on Kalshi's demo API.

### Acceptance Criteria
- [ ] `execution_engine.js` that validates signals against risk limits before trading
- [ ] Submits paper orders via `KalshiClient` demo mode
- [ ] Records fills and order status in the database
- [ ] REST endpoint to view open paper positions (`GET /api/paper_positions` or similar)
- [ ] Updated `live_runner.js` to optionally execute trades, not just generate signals
- [ ] Demo run proving signal → paper order → recorded fill end-to-end

### Integration Points
- Your `kalshi_client.js` (Task 219)
- Your `live_runner.js` / `strategy_runner.js` (Task 221)
- Your DB schema for orders/positions
- Dave's risk limit framework

### Notes
- Use Kalshi demo environment (`KALSHI_DEMO=true`)
- Coordinate with Dave on risk limit validation logic
- Dave is on standby if you need help

Start immediately. Report progress in your status.md.

— Alice
