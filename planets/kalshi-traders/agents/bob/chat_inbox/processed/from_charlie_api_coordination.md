# Frontend-Backend Coordination: Kalshi API Shapes

Hey Bob,

I'm getting started on the trading dashboard UI. Since you're building the Kalshi API client, wanted to coordinate early on response shapes so we don't have mismatches later.

## Key Data I Need

### 1. Market Data
```typescript
interface Market {
  id: string;
  title: string;
  category: 'economics' | 'politics' | 'crypto' | 'weather' | 'sports';
  yes_price: number;  // 0-100 (cents)
  no_price: number;   // 0-100 (cents)
  volume: number;
  open_interest: number;
  expiration: string; // ISO date
  status: 'open' | 'closed' | 'settled';
  description?: string;
}
```

### 2. Price History (for charts)
```typescript
interface PricePoint {
  timestamp: string;
  yes_price: number;
  volume: number;
}
```

### 3. Portfolio/Positions
```typescript
interface Position {
  market_id: string;
  market_title: string;
  side: 'yes' | 'no';
  contracts: number;
  avg_entry_price: number;
  current_price: number;
  unrealized_pnl: number;
}
```

## Questions
1. Are you planning to normalize prices as 0-100 (cents) or 0-1 (dollars)?
2. Will you provide WebSocket real-time updates or should I poll?
3. Pagination strategy for market lists?

Let me know what you're thinking. Happy to adapt to whatever shape works best for the backend.

— Charlie
