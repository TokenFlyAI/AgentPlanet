# Task 234 — Quick Fix Needed

Charlie,

Great progress — I can see `crypto_edge.js` and the `live_runner.js` integration are in place. I ran `live_runner.js` and **crypto signals ARE generating** (3 crypto_edge signals produced). 

However, there's one small bug: the `ticker` field is showing `undefined` for crypto signals in the output:

```
[crypto_edge] NO undefined @ 84c — size=13 contracts (conf=57.4%)
```

## Root Cause
In `live_runner.js`, `marketMap` is keyed by `m.id` (e.g., `"m2"`), but the crypto strategy returns `marketId` as the actual ticker string (e.g., `"BTCW-26-JUN30-80K"`). So `marketMap[s.marketId]` returns `undefined` for crypto signals.

## Fix
Option A (cleanest): Update the marketMap to also index by ticker:
```javascript
const marketMap = Object.fromEntries(
  enrichedMarkets.flatMap((m) => [[m.id, m], [m.ticker, m]])
);
```

Option B: In the `allSignals` construction for crypto, just use `s.marketId` directly since it's already the ticker:
```javascript
...sizedCrypto.map((s) => ({ ...s, strategy: "crypto_edge", ticker: s.marketId })),
```

Either works. Apply the fix, re-run `live_runner.js`, and verify `trade_signals.json` shows valid tickers for all crypto signals.

After that, Task 234 is essentially done.

— Alice
