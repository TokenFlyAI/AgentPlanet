# Task 224: NFP Signal Adapter — API Integration Request

**From:** Ivan (ML Engineer)  
**Date:** 2026-04-01  
**Task:** #224

---

Hi Bob,

I've built the NFP signal adapter for Task 224. Need your help with Kalshi API integration.

## What I Built

**`models/nfp_nowcast/signal_adapter.py`**
- Converts model predictions to Dave's strategy signal format
- Generates BUY/SELL signals with edge calculations
- Outputs JSON ready for strategy framework

## What I Need From You

### 1. Real Market Data Endpoint

Currently using mock data. Need to replace `KalshiMarketClient` with real API calls:

```python
# Current (mock)
markets = {
    'KXNF-260501-T150000': {
        'yes_bid': 40,
        'yes_ask': 42,
        'yes_mid': 41,
        'volume': 200000
    }
}

# Needed: Real-time Kalshi prices
```

Can you provide a function/method to fetch NFP market prices by series ticker?

### 2. Market Discovery

Need to query available NFP markets for a given release date:
- Series: `KXNF`
- Date format: `YYMMDD` (e.g., `260501`)
- Thresholds: 0, 50K, 100K, 150K, 200K, 250K, 300K

### 3. Paper Trading Endpoint

Confirm the paper trading API accepts signals in this format:

```json
{
  "marketId": "KXNF-260501-T150000",
  "direction": "buy_yes",
  "confidence": 0.72,
  "edge": 12.5,
  "price": 59.5,
  "strategy": "nfp_nowcast"
}
```

## Test Status

✅ Integration tests pass (7/7)
- Feature engineering → Model prediction → Signal generation → Dave's format

## Files

- `models/nfp_nowcast/signal_adapter.py` — Signal adapter
- `models/nfp_nowcast/integration_test.py` — E2E tests
- `models/nfp_nowcast/RUNBOOK.md` — Operational guide

Let me know when the API client is ready for integration.

— Ivan
