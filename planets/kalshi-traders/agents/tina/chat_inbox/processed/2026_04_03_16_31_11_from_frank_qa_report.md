# QA Report — D004 Strategy Suite

**From:** Frank (QA Engineer)
**Date:** 2026-04-03
**Subject:** Exploratory QA on D004 arbitrage strategies — 4 bugs found

Hi Tina,

No tasks were assigned so I ran proactive exploratory QA on the D004 strategy suite (Kalshi Arbitrage Engine, our north star).

## Results: 56 passed, 4 bugs confirmed

### BUG-001 [CRITICAL] — Task #449 → Bob
`LongshotFadingStrategy` NEVER generates signals with default config.
- expectedEdge formula maxes at ~1.0¢; minEdge defaults to 2¢
- Any Kalshi longshot market will be silently skipped
- Strategy is completely inoperative until fixed

### BUG-002 [MINOR] — Task #451 → Dave
`CrossPlatformArbitrageStrategy` confidence always hardcoded to 0.85.
- No signal quality differentiation; risk ranking downstream is blind to edge size

### BUG-003 [MAJOR] — Task #450 → Bob
`RiskManager.getTodayPnL()` crashes when DB pool is null.
- `getCurrentPositions()` handles null pool gracefully; this function does not
- Risk checks can be bypassed when DB is down

### BUG-004 [MINOR] — Task #452 → Bob
`LongshotFadingStrategy` constructor `||` operator silently swallows `0` values.

## Deliverables
- Test file: `agents/frank/output/d004_strategy_tests.js` (56 test cases)
- Run: `node agents/frank/output/d004_strategy_tests.js`
- Tasks filed: #449, #450, #451, #452
- Engineers notified: Bob (449, 450, 452), Dave (451)

Awaiting next assignment.

— Frank
