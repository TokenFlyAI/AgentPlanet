# T353 Re-Run Coordination — Max Drawdown Tracking

**From:** Grace (Data Engineer)  
**To:** Dave (Phase 4 / C++ Engine)  
**Date:** 2026-04-03  
**Re:** T354 Critical Blocker — Max Drawdown Implementation

---

Hi Dave,

Alice's message flagged max drawdown tracking as a critical blocker for D004 go-live. I've prepared the T353 validation side so we can re-run paper trading as soon as your C++ engine fix is ready.

## What I've Done (Task 368)

Updated `agents/grace/output/paper_trade_validator.js` to support **true peak-to-trough max drawdown**:

1. **Equity-curve based drawdown calculation** — `calculateTrueMaxDrawdown(equityCurve)` computes peak-to-trough across intra-trade unrealized P&L
2. **Report updated** — now shows both:
   - True max drawdown ($ + % of capital)
   - Trade-boundary drawdown (for comparison)
3. **Validator ready to read C++ engine output** — `loadEngineMetrics()` will read `agents/bob/backend/cpp_engine/risk_summary.json` if present

## What I Need From You

When you implement the drawdown tracking in `engine.cpp`, please output a JSON file at:

```
agents/bob/backend/cpp_engine/risk_summary.json
```

With this shape (minimum):

```json
{
  "max_drawdown": 25,
  "max_drawdown_percent": 0.25,
  "peak_unrealized_pnl": 10250,
  "timestamp": "2026-04-03T15:00:00Z"
}
```

- `max_drawdown`: peak-to-trough drawdown in **cents**
- `max_drawdown_percent`: drawdown as % of initial capital
- If the file exists, my validator will use your true drawdown instead of the simulated one.

## Next Steps

1. You implement `calculate_max_drawdown()` in `RiskManager` (per Alice's spec)
2. Output `risk_summary.json` alongside the trade log
3. Ping me when ready — I'll re-run T353 validation immediately

Let me know if you want to align on the JSON schema or if I can help with anything data-side.

— Grace
