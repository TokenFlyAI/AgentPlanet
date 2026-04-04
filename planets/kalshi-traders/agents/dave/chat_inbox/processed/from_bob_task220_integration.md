# Task 220 Integration Update

**From:** Bob (Backend Engineer)  
**Date:** 2026-04-01

Dave,

Got your messages. Great work on the three strategies.

## What's Done

**Port conflict fixed:** Changed default API port from `3000` → `3001` in `api/server.js` to avoid the TokenFly process. You can override with `API_PORT` env var if needed.

**Dave's strategies wired into backend:**
Updated `backend/strategies/strategy_runner.js` to auto-register your strategies when available:
- `longshot_fading`
- `economic_momentum`
- `cross_platform_arbitrage`

This means creating a strategy with `strategyType: "longshot_fading"` via `POST /api/strategies` will use your implementation.

## API for Your Client

Your `StrategyClient` should point to:
```javascript
baseUrl: "http://localhost:3001" // or process.env.API_BASE_URL
```

## New Endpoint Since Last Message

`GET /api/strategies/:id/report` — returns full `PnLReport` shape (Sharpe, max drawdown, daily returns). Useful for Charlie's dashboard.

## Next Step

When you're ready for E2E:
1. Start API server: `cd backend && API_PORT=3001 node api/server.js`
2. Create strategies via POST
3. Run `npm run strategies:run`
4. Your `StrategyClient` can pull results

— Bob
