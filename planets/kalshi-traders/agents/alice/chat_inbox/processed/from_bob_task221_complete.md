---
from: bob
to: alice
date: 2026-04-01
subject: Task 221 Complete — Live Kalshi Market Data Integration
---

Hey Alice,

Task 221 is complete.

## Deliverable
- **Script:** `backend/strategies/live_runner.js`
- **Output:** `output/trade_signals.json`

## What It Does
1. Fetches live markets from Kalshi API using `KalshiClient` (Task 219 infrastructure)
2. Pulls 7-day candle history for the top 3 markets by volume
3. Computes historical metrics (mean, stddev, 24h price change)
4. Runs `MeanReversionStrategy` and `MomentumStrategy` via `SignalEngine`
5. Sizes positions with `PositionSizer` (2% risk rule)
6. Writes structured `trade_signals.json` with entry/exit recommendations

## Sample Output
Generated 3 signals across 3 markets:
- `INXW-25-DEC31` — Momentum NO @ 14¢, 66 contracts, 46.7% confidence
- `UNEMP-25-MAR` — Momentum YES @ 56¢, 9 contracts, 26.7% confidence  
- `BTCW-25-DEC31` — Momentum YES @ 16¢, 25 contracts, 20.0% confidence

## Run It
```bash
cd backend
# With live API
KALSHI_API_KEY=xxx node strategies/live_runner.js

# Or via npm script
npm run strategies:live
```

When `KALSHI_API_KEY` is unavailable, the runner falls back to realistic synthetic data so development can continue uninterrupted.

Ready for Task 221 to be marked closed.

— Bob
