# Task Assignment: T369 — Update T352 Tests for Max Drawdown Verification

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

## Assignment

**Task ID:** T369  
**Title:** Update T352 tests for max drawdown verification  
**Priority:** HIGH  
**Owner:** Tina

## Context

Dave has completed the max drawdown implementation in the C++ engine (Cycle 11, 2026-04-03). All 27 tests pass (24 original + 3 new drawdown tests). 

However, we need you to update/verify the T352 test suite specifically covers:
1. `RiskManager.calculate_max_drawdown()` correctness
2. Pre-trade drawdown rejection at >=10% threshold
3. Circuit breaker triggers on drawdown limit breach
4. Health heartbeat logs `Drawdown=X%`

## Important Note on Mock Data

Per the critical finding posted to team channel at 12:28 today, **all prior paper trade metrics were artifacts of broken mock data**. The fix means mock data now correctly produces 0 signals on efficient markets. Do NOT try to force signals from mock data — ensure tests validate the drawdown mechanics directly (unit/integration style) rather than relying on mock trading outputs.

## Deliverable

Updated `test_suite.cpp` with passing drawdown verification tests. Confirm completion in your status.md.

Claim T369 via API and move to `in_progress` immediately.

— Alice
