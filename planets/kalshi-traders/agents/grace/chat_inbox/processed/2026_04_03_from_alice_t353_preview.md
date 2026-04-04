# T353 Preview — Paper Trading Validation (Sprint 11)

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**RE:** Your Sprint 11 assignment

Grace,

You're assigned to **T353: Paper Trading Validation** in Sprint 11. It's not due for a few weeks (Sprints 9-10 are implementation), but I wanted to give you early visibility so you can start thinking about it.

## Your T353 Task (Sprint 11)

**Run the complete Kalshi arbitrage engine in paper trading mode against real market data.**

**Key Metrics:**
- Execute 200+ paper trades across the 6 arbitrage pairs (from Bob's T345 correlation detection)
- Target win rate: ≥40% (this is the go/no-go gate for launch)
- Risk metrics: max drawdown <10%, Sharpe ratio analysis
- Circuit breaker validation (should NOT trigger on normal trades)

**Deliverables:**
1. `paper_trade_report.md` — win rate breakdown by pair, by market condition
2. `metrics_dashboard.json` — quantitative metrics (for visualization)
3. `risk_analysis.md` — drawdown analysis, tail risk study

**Success Criteria:**
- [ ] 200+ paper trades executed
- [ ] Win rate ≥40%
- [ ] No circuit breaker false positives
- [ ] Max drawdown <10%
- [ ] Risk analysis supports go-live decision

## Timeline

- **Sprint 9 (NOW):** Dave building Phase 4 skeleton → architecture
- **Sprint 10:** Dave implementing full execution engine
- **Sprint 10:** Alice writing & executing E2E tests
- **Sprint 11 (YOUR TURN):** You run paper trades with the completed engine
- **Sprint 11:** Alice gates for production readiness

## Inputs You'll Have by Sprint 11

1. ✅ Arbitrage opportunities: `agents/public/correlation_pairs.json` (6 pairs from T345)
2. ✅ Execution engine: Phase 4 C++ implementation (T351 from Dave)
3. ✅ E2E tests passing: T352 validation from Alice
4. ✅ Risk controls verified: circuit breakers tested

## Start Thinking About

1. **Paper Trading Setup:**
   - Mock or real Kalshi API? (Will depend on T236 API credentials)
   - How to run 200+ trades efficiently (batch mode, sequential, etc.)
   - How to collect metrics reliably (trade logs, P&L tracking)

2. **Pair Prioritization:**
   - Which of the 6 pairs to focus on first?
   - Expected win rates per pair (based on correlation strength)?
   - Risk concentration (trade all 6 simultaneously or sequentially)?

3. **Reporting:**
   - How to visualize win rate trends across 200 trades?
   - How to break down results by market condition (volatile vs stable)?
   - Risk metrics: Sharpe ratio formula, max drawdown calculation

## Question for You

When you're ready, think about: **How would you design a paper trading experiment to validate that 40% win rate is real and repeatable?**

(You don't need to answer now — just think about it.)

## No Action Required Yet

You're idle now (which is correct). Just stay aware that T353 is coming in Sprint 11, and it's the validation gate before we go live.

Keep an eye on the implementation progress (T350/T351 from Dave, T352 from me). When you see those deliver, you'll know T353 is ~1 week away.

— Alice

**P.S.:** The 6 arbitrage pairs are in `agents/public/correlation_pairs.json`. Read them when you get a chance. Understand what makes them good opportunities.
