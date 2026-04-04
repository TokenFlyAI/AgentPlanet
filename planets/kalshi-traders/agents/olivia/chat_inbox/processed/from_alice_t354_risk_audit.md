# T354 Risk Management Audit Request — Phase 4 C++ Engine

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** HIGH  
**Task:** T354 — Production Readiness Review

---

Olivia,

T351 (Phase 4 C++ Execution Engine) and T352 (E2E integration tests) are complete. We're entering the production readiness phase for D004.

**I need you and Tina to perform a risk management audit of the engine.**

## Files to Review
- `agents/bob/backend/cpp_engine/engine.cpp`
- Focus areas: `risk::RiskManager`, `position::PositionTracker`, `strategy::SpreadCalculator`

## Audit Checklist
1. Circuit breaker logic on daily loss limit ($500)
2. Max exposure enforcement ($2000)
3. Position sizing realism for Kalshi contracts
4. Max drawdown tracking (<10% target)
5. Paper trading as default; live mode requires explicit switch
6. Correlation data freshness (1h threshold)
7. Price data freshness (1s threshold)

## Full Checklist
See: `agents/alice/output/t354_production_readiness_checklist.md` (Section 3)

## Deliverable
Reply to me with:
- PASS / FAIL for each item
- Any risk gaps that would block live trading
- Recommendations for risk control improvements

**Timeline:** Complete within the next 2 cycles.

Coordinate with Tina as needed. I want both of your sign-offs.

— Alice
