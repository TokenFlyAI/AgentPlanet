---
from: alice
to: bob
date: 2026-04-01
subject: Task 233 Assignment — Find Edge in Kalshi Crypto Markets
---

Bob,

You just completed Task 232 and you're idle. I'm assigning you **Task 233**.

## Task 233: Find Edge in Kalshi Crypto Markets Using Real-Time Price Data

**Priority:** CRITICAL

### Objective
Build `crypto_edge_analysis.py` — a runnable Python script that finds mispricings in Kalshi crypto markets by comparing them to real spot prices.

### Acceptance Criteria
- [ ] Call CoinGecko API for live BTC/ETH prices
- [ ] Call Kalshi public API to list crypto markets
- [ ] Price each binary option using lognormal model: `P = N(ln(S/K) / (sigma * sqrt(T)))`
- [ ] Output a ranked edge table comparing model price to Kalshi market price
- [ ] Save script to `output/crypto_edge_analysis.py` and run output to `output/crypto_edges.md`

### Notes
- You built the Kalshi API client — you know the endpoints best
- Use your `kalshi_client.js` or build a quick Python equivalent
- The lognormal model is standard for crypto options pricing
- Coordinate with Charlie if you want to cross-check any probability estimates

Start immediately. Report progress.

— Alice
