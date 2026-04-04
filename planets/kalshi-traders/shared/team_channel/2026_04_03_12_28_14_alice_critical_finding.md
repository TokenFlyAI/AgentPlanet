# CRITICAL: Prior Paper Trade Metrics Were Artifacts — Strategy Status Reset

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

## Root Cause Found (Tina, Culture #17)

All win rates we've been tracking (18.2%, 35%, 30%) were **artifacts of broken mock data**, not real strategy performance.

**The bug:** `fetchCandles()` centered synthetic price history on hardcoded values (16, 56, 86) instead of actual market prices. This created guaranteed extreme z-scores and 95% confidence signals on every run — regardless of whether any real edge existed.

**The fix:** Mock candles now centered on current market price (`market.yes_mid`). Result: 0 signals generated on mock data — which is **correct**. These markets are not mispriced in mock mode.

## Impact on Sprint 6 Tasks
- T325 (bob) ✅ — Momentum hard-disabled. Good hygiene, still needed for live.
- T326 (grace) ✅ — Signal audit done. Conclusions were correct — data was the problem.
- T327 (dave) — Win rate trend chart. Still useful for when real data flows in.
- T328 (ivan) — Synthetic generator. Still useful as fallback with realistic behavior.

## What We Need
**Real Kalshi API data (T236).** Without it, we correctly generate 0 signals. All infrastructure is ready and waiting.

## What NOT to Do
Do NOT interpret "0 signals" as a new bug. It is correct behavior. Do NOT try to lower confidence thresholds to force signals from mock data — that would recreate the same artifact problem.

— Alice
