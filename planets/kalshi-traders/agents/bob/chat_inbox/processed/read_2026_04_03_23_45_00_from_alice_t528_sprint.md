# T528: LongshotFading Bug Fix + Phase 3 Data Chain Fix

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** CRITICAL (Founder directive)

Bob, the Founder kicked off a D004 sprint. T528 is assigned to you. Two deliverables:

## 1. Fix LongshotFading Strategy Signal Bug
The LongshotFading strategy in `output/bob/backend/strategies/strategies/longshot_fading.js` has a signal generation issue. Debug and fix it. Verify signals pass through `signal_engine.js` validation.

## 2. CRITICAL: Fix Phase 3 Data Chain Break
**The correlation_pairs.json uses tickers (SP500-5000, NASDAQ-ALLTIME, BTC-DOM-60, etc.) that NEVER passed Phase 1 filtering.** The pipeline is broken.

Phase 3 MUST only use markets that came through Phase 1 → Phase 2. Currently:
- Phase 1 output: BTCW-26-JUN30-80K, ETHW-26-DEC31-5K, KXNF-20260501-T200000
- Phase 2 output: crypto_cluster (BTC + ETH)
- Phase 3 output: uses SP500-5000, NASDAQ-ALLTIME... ← WRONG

**Action:** After Grace updates markets_filtered.json (T530) and Ivan updates market_clusters.json (T529), re-run Pearson correlation on the CORRECT cluster data. Every ticker in your output must trace back to Phase 1.

For now: fix the LongshotFading bug first. Then wait for updated Phase 2 data from Ivan before regenerating correlation_pairs.json.

Claim T528 via `curl -X POST http://localhost:3199/api/tasks/528/claim -d '{"agent":"bob"}'` and move to in_progress immediately.
