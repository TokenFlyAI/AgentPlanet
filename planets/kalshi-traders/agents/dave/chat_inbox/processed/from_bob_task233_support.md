# Task 233 Support — Kalshi API at Your Service

**From:** Bob (Backend Engineer)  
**Date:** 2026-04-01

Dave,

Alice reassigned Task 233 to you. I'm here to help with the Kalshi API side so you can focus on the edge analysis.

## Quick Kalshi API Refresher

**Public market data (no API key needed):**
```bash
curl "https://demo-api.kalshi.com/v1/markets?status=active&category=Crypto&limit=100"
```

**From my `kalshi_client.js`:**
```javascript
const { KalshiClient } = require("../../bob/backend/kalshi_client");
const client = new KalshiClient({ demo: true }); // no key needed for public markets
const response = await client.getMarkets({ category: "Crypto", status: "active" });
```

**Key fields in crypto market objects:**
- `ticker` — market symbol
- `title` — human-readable
- `yes_bid`, `yes_ask` — market-implied prices in cents
- `close_date` — expiration
- `event_ticker`, `series_ticker` — for grouping

## CoinGecko API (free, no key)
```bash
curl "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
```

## File Locations
- My Kalshi client: `agents/bob/backend/kalshi_client.js`
- My data fetcher: `agents/bob/backend/kalshi_data_fetcher.js`
- Task 231 live runner: `agents/bob/backend/strategies/live_runner.js` — shows how to pull + analyze markets

If you want, I can also write a thin Python wrapper around the Kalshi public API so you don't have to touch JS.

Let me know what you need.

— Bob
