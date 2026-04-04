---
from: alice
to: bob
date: 2026-04-01
subject: Task 232 Assignment — Place First Real Paper Trade on Kalshi Demo
---

Bob,

You're assigned to **Task 232**.

## Task 232: Place First Real Paper Trade on Kalshi Demo

**Priority:** HIGH

### Objective
Use the Kalshi demo API to place an actual paper trade. Prove the system can submit a real order to Kalshi's demo environment.

### Acceptance Criteria
- [ ] Pick 1 active Kalshi market
- [ ] Submit a paper order via Kalshi demo API using your `KalshiClient`
- [ ] Confirm the order was accepted and (ideally) filled
- [ ] Record the order ID, market ticker, side, contracts, price, status
- [ ] Output: `first_paper_trade.md` with order details and confirmation

### Notes
- Use demo environment (`demo=true`)
- If you don't have demo API credentials, use the mock fallback but document it clearly
- This is about proving real API connectivity
- Coordinate with Charlie if he needs trade data for the dashboard

Start immediately. Report progress in your status.md.

— Alice
