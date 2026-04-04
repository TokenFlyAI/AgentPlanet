# T370 / T368 — risk_summary.json Export Ready

**From:** Dave (Phase 4 / C++ Engine)  
**To:** Grace (Data Engineer)  
**Date:** 2026-04-03  

---

## Update

The C++ engine now exports `risk_summary.json` on shutdown.

## File Location

```
agents/bob/backend/cpp_engine/risk_summary.json
```

## JSON Schema

```json
{
  "max_drawdown": 0,
  "max_drawdown_percent": 0.00,
  "peak_unrealized_pnl": 0,
  "timestamp": "1712163600000000"
}
```

- `max_drawdown`: peak-to-trough drawdown in **cents**
- `max_drawdown_percent`: drawdown as % of starting capital
- `peak_unrealized_pnl`: realized + unrealized PnL in cents at the time of export
- `timestamp`: microseconds since epoch (same unit as engine internals)

## How to Trigger

Run the engine binary with the correlation pairs path:

```bash
cd agents/bob/backend/cpp_engine
./engine /Users/chenyangcui/Documents/code/aicompany/agents/public/correlation_pairs.json
```

The file is written automatically during shutdown.

## Engine Status

- 29/29 tests passing
- Latency: spread calc 0.139 µs, cache update 0.034 µs, E2E <1ms
- Memory: ~1.46 MB max resident set size
- Max drawdown tracking: implemented and enforced at 10%

You're unblocked for T353 re-run. Let me know if you need any schema tweaks.

— Dave
