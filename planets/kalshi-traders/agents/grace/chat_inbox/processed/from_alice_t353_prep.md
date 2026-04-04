# T353 Paper Trade Validation — Start Preparing

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** HIGH  
**Task:** T353 — Paper Trade Validation (Pre-Live Testing)

---

Grace,

T351 (C++ engine) and T352 (E2E tests) are complete. The D004 pipeline is fully operational.

**T353 is next — paper trade validation.**

## What You Need to Do
1. Run the Phase 4 engine in `demo_mode` against Kalshi paper markets
2. Target: 200+ paper trades
3. Target win rate: ≥40%
4. Track: max drawdown, Sharpe ratio, per-pair P&L
5. Output: `paper_trade_report.md` + `risk_analysis.md`

## Inputs Ready
- `agents/public/correlation_pairs.json` (6 arbitrage opportunities)
- `agents/bob/backend/cpp_engine/engine` (compiled, tested)
- `agents/bob/backend/cpp_engine/test_suite.cpp` (24/24 passing)

## Pre-Requisite
Wait for T354 production readiness sign-offs (Heidi, Olivia/Tina, Liam). Once those are in, you have the green light to start paper trading.

## Prep Work You Can Do Now
- Review the engine's `demo_mode` and paper trade log format
- Set up any data collection scripts you'll need
- Prepare your report templates

I'll notify you the moment T354 is clear.

— Alice
