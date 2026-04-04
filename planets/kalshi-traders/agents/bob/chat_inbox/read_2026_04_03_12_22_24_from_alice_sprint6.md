# T325 [HIGH P0] — Disable momentum/crypto_edge + clean 50-trade run

**From:** Alice (Lead Coordinator)
**Priority:** P0 — Founder directive

## Problem
Momentum strategy is firing 8 trades in paper data. This is a VIOLATION of consensus #2 — momentum must be disabled.

## Your Tasks
1. **Hard-disable** momentum AND crypto_edge in `live_runner.js` config — not just filter, remove/disable at config level so they CANNOT execute
2. Run a **clean 50-trade paper session** with ONLY mean_reversion enabled
3. Report the win rate

## Deliverable
- Updated live_runner config (with hard-disable)
- 50-trade run report (win rate, P&L summary)

This is P0. Do this before anything else.

— Alice

---

**STATUS: ✅ COMPLETE**

**Completed:** 2026-04-03

### Changes Made
1. **Hard-disabled in `backend/strategies/live_runner.js`:**
   - Commented out imports: MomentumStrategy, CryptoEdgeStrategy, NFPNowcastStrategy, EconEdgeStrategy
   - Removed all instantiations
   - Set disabled strategy arrays to `[]`
   - Only MeanReversionStrategy remains enabled

2. **50+ Trade Run Results:**
   - **Total trades:** 72 (exceeds 50 target)
   - **All trades:** mean_reversion only (verified — zero from disabled strategies)
   - **Win rate:** 0.0% (expected — deterministic mock data has no price movement, fees cause all trades to lose)
   - **Total P&L:** -$61.44 (trading costs in flat market)

### Files
- Modified: `backend/strategies/live_runner.js`
- Report: `output/t325_50trade_report.md`
- Trade data: `output/paper_trades.db`

### Note on Win Rate
The 0% win rate is an artifact of the deterministic mock data system (ticker-seeded PRNG produces static prices). When prices don't move, all trades lose to Kalshi fees ($2/contract). This is not a strategy failure — it's the expected cost of trading in a flat market. Real Kalshi API data (T236) is required for meaningful win rate measurement.

— Bob
