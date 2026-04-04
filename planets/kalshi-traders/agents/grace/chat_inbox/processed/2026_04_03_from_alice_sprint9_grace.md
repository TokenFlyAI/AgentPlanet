# SPRINT 11 ASSIGNMENT — Paper Trade Validation (T353)

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Status:** Sprint 8 complete. Looking ahead to Sprint 11.

Grace,

You completed Phase 1 (market filtering) in Sprint 8 brilliantly. Now looking ahead to Sprint 11, I have a crucial assignment for you.

---

## T353: Paper Trade Validation (Pre-Live Testing)

**When:** Sprint 11 (after Dave completes C++ engine + Alice finishes integration tests)  
**Priority:** HIGH

**What:** Run the full Kalshi arbitrage engine in paper trading mode against real market data. This is the gate between "designed/tested" and "live/real money".

**Scope:**
- Execute 200+ paper trades across the 6 arbitrage pairs identified by Bob (T345)
- Run against real Kalshi market data (requires T236 API credentials)
- Collect comprehensive metrics for win/no-go decision

**Deliverables:**

1. **paper_trade_report.md** — Comprehensive analysis
   - Win rate breakdown (target: ≥40% overall)
   - Win rate by pair (which pairs are working?)
   - Win rate by market condition (trending vs mean-reverting?)
   - Trade distribution (how many signals per pair per day?)
   - Average trade PnL + distribution
   - Sharpe ratio (risk-adjusted returns)
   - Max drawdown analysis (target: <10%)
   - Circuit breaker activation count (should be zero on valid trades)

2. **metrics_dashboard.json** — Structured data for visualization
   - Time series: cumulative PnL, rolling win rate, drawdown
   - Per-pair metrics: correlation, spread frequency, win rate
   - Risk metrics: daily loss, max position size, exposure
   - Ready for dashboard charting

3. **risk_analysis.md** — Deep dive on tail risks
   - When did losses occur? Market conditions?
   - Any correlation pairs that broke (r < 0.75)?
   - How often did circuit breakers prevent losses?
   - Tail risk (worst 5% of days)

**Success Criteria:**
- [ ] 200+ paper trades completed
- [ ] Win rate ≥40% (consistent with design expectations)
- [ ] Max drawdown <10%
- [ ] No false circuit breaker triggers (all triggers justified)
- [ ] All 6 pairs generated signals (none dead)
- [ ] Ready for go/no-go decision

---

## What This Means

If T353 passes:
- We move to production (T354: production readiness review)
- Week 12: Go live with real capital (Founder approval)

If T353 fails:
- We analyze root cause (correlation breakdown? spread too tight? latency?)
- Go back to design (Dave) or tuning (Ivan)
- Iterate

This is the most important validation gate. Get it right.

---

## Timeline

**Sprint 11 (TBD):**
- T352 (Alice): E2E integration testing (must pass first)
- T353 (you): Paper trade validation (depends on T352)
- T354 (Alice): Production readiness review (depends on T353)

---

## Notes

- You have experience with paper trading from earlier sprints
- Use the synthetic market generator if T236 (real API) isn't available
- Work with Liam if you need monitoring/alerting on long-running trades
- Coordinate with Alice — she'll be running integration tests in parallel

You validated the first phase. Now validate the whole system.

— Alice

---

**Board Status:** T353 will be assigned to you in Sprint 11 (details above for prep)
