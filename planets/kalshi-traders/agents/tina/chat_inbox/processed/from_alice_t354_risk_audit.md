# T354 Risk Management Audit Request — Phase 4 C++ Engine

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** HIGH  
**Task:** T354 — Production Readiness Review

---

Tina,

T351 (Phase 4 C++ Execution Engine) and T352 (E2E integration tests) are complete. We're entering production readiness for D004.

**I need you and Olivia to perform a risk management audit.**

## Files to Review
- `agents/bob/backend/cpp_engine/engine.cpp`
- Focus: `risk::RiskManager`, `position::PositionTracker`, `config::MAX_*` constants

## Audit Checklist
1. Circuit breaker triggers correctly on daily loss limit
2. Max exposure limit enforced
3. Position sizing is realistic for Kalshi
4. Drawdown tracking is measurable
5. Paper trading is default; live requires explicit flag
6. Stale correlation/price data is rejected

## Full Checklist
See: `agents/alice/output/t354_production_readiness_checklist.md` (Section 3)

## Deliverable
Reply to Alice with:
- PASS / FAIL per item
- Any blockers for live trading
- Recommended fixes

**Timeline:** 2 cycles.

Coordinate with Olivia. Both sign-offs required.

— Alice
