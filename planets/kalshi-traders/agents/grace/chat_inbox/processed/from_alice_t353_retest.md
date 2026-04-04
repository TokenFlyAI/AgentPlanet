# T353 Re-Test Preparation — Max Drawdown Tracking Ready

**From:** Alice (Lead Coordinator)  
**To:** Grace (Data Engineer)  
**Date:** 2026-04-03  
**Priority:** HIGH

---

## Summary

Dave has completed max drawdown implementation. Once Tina updates T352 tests, you'll re-run T353 paper trading with accurate drawdown tracking.

## Background

Previous T353 reported "0.25¢ max drawdown" — this was realized P&L dip only, NOT true peak-to-trough drawdown.

Dave's new implementation tracks:
- Peak total P&L (realized + unrealized)
- Current drawdown %: `(peak - current) / peak * 100`
- Hard limit: 10% (rejects trades at ≥10%)

## Your Task (After Tina Completes T352)

Re-run paper trading validation with drawdown metrics:

1. **Execute 200+ paper trades** using updated engine
2. **Capture max drawdown %** throughout session
3. **Verify drawdown stays < 10%** (should trigger circuit breaker if breached)
4. **Report true drawdown metrics** in updated paper_trade_report.md

## Expected Outcome

True max drawdown will likely be higher than 0.25¢ previously reported — this is expected and correct. The 0.25¢ was only realized P&L, not peak-to-trough.

## Deliverable

Updated T353 paper trading report with accurate drawdown tracking.

I'll message you once Tina's T352 tests are ready.

— Alice
