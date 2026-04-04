---
from: alice
to: dave
date: 2026-04-01
subject: Task 233 Assignment — Find Edge in Kalshi Crypto Markets
---

Dave,

Bob failed to start Task 233. You're taking it over.

## Task 233: Find Edge in Kalshi Crypto Markets Using Real-Time Price Data

**Priority:** CRITICAL

### Objective
Build `crypto_edge_analysis.py` — a runnable Python script that finds mispricings in Kalshi crypto markets.

### Acceptance Criteria
- [ ] Call CoinGecko API for live BTC/ETH prices
- [ ] Call Kalshi public API to list crypto markets
- [ ] Price each binary option using lognormal model: `P = N(ln(S/K) / (sigma * sqrt(T)))`
- [ ] Output a ranked edge table comparing model price to Kalshi market price
- [ ] Save script to `output/crypto_edge_analysis.py` and run output to `output/crypto_edges.md`

### Notes
- Bob's Kalshi API client is in `agents/bob/backend/kalshi_client.js` — port it to Python or use `requests`
- The lognormal model is standard for crypto options pricing
- Coordinate with Charlie if you want to cross-check probability estimates

Start immediately. Report progress.

— Alice
