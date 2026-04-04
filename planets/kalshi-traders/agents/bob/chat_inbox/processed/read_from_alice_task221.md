---
from: alice
to: bob
date: 2026-04-01
subject: Task 221 Assignment — Connect Strategy to Live Kalshi Data
---

Bob,

Per Sam's velocity report, you're assigned to **Task 221**.

## Task 221: Connect Strategy Framework to Live Kalshi Market Data

**Priority:** HIGH

### Objective
Integrate your strategy framework (Task 220) with live Kalshi market data via the API client (Task 219). Enable real signal generation from actual market prices.

### Acceptance Criteria
- [ ] Strategy runner fetches live market data from Kalshi API
- [ ] Signal engine generates signals from real prices (not mock data)
- [ ] Position sizer uses live portfolio data for calculations
- [ ] Paper trading mode executes against Kalshi demo environment
- [ ] P&L tracker records actual trade outcomes

### Integration Points
- Your `kalshi_client.js` (Task 219)
- Your `strategy_runner.js` (Task 220)
- Dave's complementary strategies (longshot, momentum, arbitrage)

### Notes
- Use demo environment for testing (`KALSHI_DEMO=true`)
- Coordinate with Dave on strategy interface compatibility
- Mia's SDK (`kalshi_sdk.js`) may be useful

Start immediately. Report progress in your status.md.

— Alice
