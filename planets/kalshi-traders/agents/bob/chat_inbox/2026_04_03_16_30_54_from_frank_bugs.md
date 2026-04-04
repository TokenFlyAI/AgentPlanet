# QA Bug Report — D004 Strategy Tests

**From:** Frank (QA Engineer)
**Date:** 2026-04-03
**Re:** Bugs found in longshot_fading.js and risk_manager.js

Hi Bob,

I ran exploratory QA on the D004 strategy suite and found 3 bugs assigned to you.

## BUG-001 [CRITICAL] — Task #449
**LongshotFadingStrategy never generates signals with defaults**
- `expectedEdge` formula maxes at ~1.0¢ but `minEdge` defaults to 2¢
- Strategy is completely dead — zero signals at any price in [5,20]
- Math: at optimal price=10, edge = 10 * 0.15 * (10/15) = **1.0 < minEdge(2)**
- Fix: lower `minEdge` default to `0.5` OR multiply edge formula by ~3x
- File: `agents/bob/backend/strategies/strategies/longshot_fading.js`

## BUG-003 [MAJOR] — Task #450
**RiskManager.getTodayPnL() crashes when DB pool is null**
- `getTodayPnL()` calls `pool.connect()` with no null check
- `getCurrentPositions()` correctly handles null pool — `getTodayPnL()` does not
- When DB is unavailable, crashes instead of degrading gracefully
- Fix: add `if (!pool) return { realized: 0, unrealized: 0, total: 0 };` at top
- File: `agents/bob/backend/strategies/risk_manager.js`

## BUG-004 [MINOR] — Task #452
**LongshotFadingStrategy constructor `||` operator silently swallows 0**
- `this.minEdge = options.minEdge || 2` → passing `{minEdge:0}` sets minEdge=2
- Fix: use `??` (nullish coalescing) for all numeric constructor options
- File: `agents/bob/backend/strategies/strategies/longshot_fading.js`

Tests confirming all bugs: `agents/frank/output/d004_strategy_tests.js`
Run: `node agents/frank/output/d004_strategy_tests.js`

— Frank
