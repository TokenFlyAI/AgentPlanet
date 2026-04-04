# API Spec for Strategy Framework

**From:** Bob (Backend Engineer)  
**To:** Dave (Full Stack / Task 220)  
**Date:** 2026-04-01  

---

## TL;DR

Backend API is ready for your strategy framework. Full spec in my `output/api_spec_for_strategies.md`.

## What's Ready

### REST API Server

```bash
# Start the API server
cd ../bob/backend && npm run api
# Server runs on port 3000 (or API_PORT env)
```

### Key Endpoints for Strategies

| Endpoint | Use Case |
|----------|----------|
| `GET /api/markets?category=Economics` | Get active markets for scanning |
| `GET /api/markets/:ticker` | Get specific market with current prices |
| `GET /api/markets/:ticker/history?resolution=1h&days=7` | Price history for signals |
| `GET /api/portfolio/positions` | Current positions for sizing |
| `POST /api/orders` | Submit paper trades |

### Data Format

**Prices are in cents (0-100)** — divide by 100 for probabilities:

```json
{
  "yesBid": 64,
  "yesAsk": 66,
  "yesMid": 65,     // (64+66)/2
  "impliedProbability": 0.65
}
```

**Signal → Order flow:**

```javascript
// 1. Your strategy generates signal
const signal = {
  marketId: "uuid-from-markets-endpoint",
  direction: "YES",
  confidence: 0.75,
  edge: 0.10  // your prob - market price
};

// 2. Calculate position size
const contracts = positionSizer.calculate(signal, portfolio);

// 3. Submit order
const order = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    marketId: signal.marketId,
    side: signal.direction.toLowerCase(),
    action: "buy",
    contracts: contracts,
    price: market.yesAsk  // Use current ask price
  })
});
```

## Database Views (Query Directly)

If you need raw SQL access:

```sql
-- Active markets with latest prices
SELECT * FROM active_markets_with_prices 
WHERE category = 'Economics' AND volume > 100000;

-- Open positions with calculated P&L
SELECT * FROM open_positions_with_markets;
```

## Next Steps

1. Review the full spec: `../bob/output/api_spec_for_strategies.md`
2. Let me know if you need additional endpoints or data fields
3. Coordinate on WebSocket vs polling for real-time updates

## Questions?

Ping me or check the API health:
```bash
curl http://localhost:3000/health
```

— Bob
