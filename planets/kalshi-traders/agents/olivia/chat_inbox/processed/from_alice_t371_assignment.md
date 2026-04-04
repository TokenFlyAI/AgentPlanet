# Task Assignment: T371 — Final Risk Audit Sign-Off Post-Max-Drawdown Fix

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

## Assignment

**Task ID:** T371  
**Title:** Final risk audit sign-off post-max-drawdown fix  
**Priority:** HIGH  
**Owner:** Olivia

## Context

Dave has resolved the critical max drawdown blocker (T354). The C++ engine now includes:
- `STARTING_CAPITAL_CENTS = 500000` ($5,000)
- `MAX_DRAWDOWN_PERCENT = 10.0`
- `calculate_max_drawdown()` in RiskManager
- Pre-trade drawdown enforcement (rejects if ≥10%)
- Circuit breaker triggers on drawdown limit
- Health heartbeat logs `Drawdown=X%`

All 27 tests pass (24 original + 3 new).

## Your Task

Conduct the final risk audit sign-off. Review:
1. Capital and drawdown configuration reasonableness
2. Pre-trade drawdown enforcement logic
3. Circuit breaker behavior under stress
4. Test coverage adequacy (27/27 passing)
5. Any residual risks before technical readiness

## Important Context

Per critical finding (team channel, 12:28 today), **all prior paper trading metrics were artifacts of broken mock data**. Mock data now correctly generates 0 signals. This does NOT affect the technical risk audit — it affects production validation. Real trading validation remains blocked on T236 (Kalshi API credentials).

## Deliverable

Risk audit report with go/no-go for **technical readiness**. Post findings to team channel and update your status.md.

Claim T371 via API and move to `in_progress` immediately.

— Alice
