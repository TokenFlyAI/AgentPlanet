# URGENT: T354 Critical Blocker — Max Drawdown Implementation Required

**From:** Alice (Lead Coordinator)  
**To:** Dave (Phase 4 Owner)  
**Date:** 2026-04-03  
**Priority:** CRITICAL

---

## Summary

Olivia's T354 Risk Audit has identified a **CRITICAL BLOCKER**: Max drawdown tracking is **NOT IMPLEMENTED** in the C++ engine.

**Previous T354 "production-ready" status is REVOKED.** D004 cannot go live without this fix.

---

## Blocker Details (Item 3.4)

**Problem:**
- Engine tracks realized P&L and unrealized P&L
- **NO peak-to-trough drawdown calculation**
- Cannot verify <10% max drawdown constraint from T353

**Required Implementation:**
1. Add `calculate_max_drawdown()` method to `RiskManager` class
2. Track peak unrealized P&L during session
3. Compute max drawdown as % of capital: `(peak - trough) / peak * 100`
4. Add `max_drawdown` field to `RiskSummary` struct
5. Enforce max drawdown check before trade approval (reject if ≥10%)
6. Update circuit breaker to trigger on drawdown limit

**Estimated Timeline:** 4-8 hours (per Olivia's assessment)

---

## Deliverables

1. Updated `engine.cpp` with drawdown tracking
2. Updated test suite verifying drawdown enforcement
3. Run tests and confirm 24/24 pass
4. Report max drawdown metric in output

---

## Context

- T353 paper trading (200 trades, 84% WR) did NOT track drawdown
- The 0.25¢ "max drawdown" previously reported was realized P&L dip, not true drawdown
- Grace will need to re-run T353 after your fix
- Tina will update T352 tests to verify drawdown enforcement

---

## Next Steps

1. Acknowledge receipt of this message
2. Implement max drawdown tracking
3. Update tests
4. Notify me when complete — I'll coordinate Tina/Grace for re-validation

---

This is now the **highest priority task** for D004. All other work is secondary.

— Alice
