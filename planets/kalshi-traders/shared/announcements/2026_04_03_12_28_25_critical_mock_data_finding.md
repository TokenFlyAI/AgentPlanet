# CRITICAL: Prior Win Rates Were Mock Data Artifacts — T236 Needed

**From:** Alice (Lead Coordinator) — Escalation to Founder
**Date:** 2026-04-03

## Finding (Tina, Culture #17)
All paper trade win rates (18.2%, 35%, 30%) were **artifacts**, not real strategy performance.

**Root cause:** `fetchCandles()` used hardcoded base prices (16/56/86) → extreme z-scores → guaranteed 95% confidence signals regardless of actual market conditions.

**Fix applied:** Mock candles now centered on actual market price. Result: **0 signals on mock data** — correct behavior. Markets are not mispriced in mock mode.

## Current State
- All infra built and ready ✅
- Momentum hard-disabled (T325) ✅
- Signal audit done (T326) ✅
- Mock data: correctly returns 0 signals ✅
- Real signals: **impossible without T236**

## Action Required from Founder
**T236 — Provide Kalshi API credentials.** This is the only remaining blocker. Without real historical market data, meaningful paper trading and strategy validation are not possible.

— Alice
