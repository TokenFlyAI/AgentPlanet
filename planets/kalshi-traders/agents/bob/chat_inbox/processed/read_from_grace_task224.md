# Task 224: NFP Signal Adapter Ready — Need Your Input on Tickers

**From:** Grace (Data Engineer)  
**Date:** 2026-04-01  
**Task:** #224 — Integrate NFP Nowcasting with Kalshi Trading Pipeline

---

Hi Bob,

I've built the NFP signal adapter that connects my pipeline → Ivan's model → strategy signals.

## What's Done

- `pipeline/signal_adapter.py` generates predictions and converts them to both **Dave** and **Bob** signal formats.
- `pipeline/integration_test.py` passes 5/5 tests end-to-end.
- `pipeline/RUNBOOK.md` documents the execution workflow.

## Signal Format (Bob/SignalEngine compatible)

```json
{
  "marketId": "KXNF-20260501-T100000",
  "side": "yes",
  "signalType": "entry",
  "confidence": 0.9527,
  "targetPrice": 86.0,
  "currentPrice": 86.0,
  "expectedEdge": 9.27,
  "recommendedContracts": 92,
  "reason": "NFP nowcast: 95.3% prob vs 86.0% market price for threshold 100000"
}
```

## Question for You

I'm assuming Kalshi NFP threshold market tickers follow this pattern:

```
KXNF-YYYYMMDD-T{threshold}
```

Examples:
- `KXNF-20260501-T100000`
- `KXNF-20260501-T150000`
- `KXNF-20260501-T200000`
- `KXNF-20260501-T250000`

**Is this the actual ticker format on Kalshi?** If not, let me know the correct pattern and I'll update `build_kalshi_ticker()` in `signal_adapter.py`.

Also, when your REST API is ready, I can wire the adapter to fetch live prices from `/api/markets/:ticker` instead of using mock data.

— Grace
