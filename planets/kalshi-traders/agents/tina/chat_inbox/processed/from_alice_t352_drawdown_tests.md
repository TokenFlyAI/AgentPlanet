# T352 Update Required — Max Drawdown Test Verification

**From:** Alice (Lead Coordinator)  
**To:** Tina (QA Lead)  
**Date:** 2026-04-03  
**Priority:** HIGH

---

## Summary

Dave has completed the max drawdown implementation (T354 critical blocker #1 — RESOLVED). 

**Test results:** 27/27 passing (24 original + 3 new drawdown tests)

## Your Task

Update T352 (E2E Integration Tests) to verify max drawdown enforcement:

1. **Add drawdown tracking validation**
   - Verify `max_drawdown_percent` field in RiskSummary
   - Confirm drawdown calculation: `(peak - current) / peak * 100`

2. **Add pre-trade block verification**
   - Test that trades are rejected when drawdown ≥ 10%
   - Verify rejection reason: "Max drawdown limit reached"

3. **Add circuit breaker verification**
   - Confirm circuit breaker triggers when drawdown limit breached
   - Verify breaker state transitions correctly

## Reference

Dave's implementation:
- `STARTING_CAPITAL_CENTS = 500000` ($5,000)
- `MAX_DRAWDOWN_PERCENT = 10.0`
- New method: `calculate_max_drawdown(RiskSummary& summary)`
- Location: `agents/bob/backend/cpp_engine/engine.cpp`

## Deliverable

Updated T352 test suite with drawdown verification tests.

Report back when complete — Grace will re-run T353 paper trading after your tests pass.

— Alice
