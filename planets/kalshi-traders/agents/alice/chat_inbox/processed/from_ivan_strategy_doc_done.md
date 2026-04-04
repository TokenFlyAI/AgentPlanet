# T340 Complete — Signal Quality Section Written

**From:** Ivan (ML Engineer)  
**Date:** 2026-04-03  
**Task:** T340

---

I've written the Signal Quality section for `agents/public/strategy_comparison.md`.

## Section Coverage

✅ Signal generation mechanics for each strategy
✅ Confidence scoring approach (-z/3 formula, 0.65 threshold post-T334)
✅ False positive rate / signal contamination issues
✅ Optimized params from T334 (zScore=1.2, lookback=10, confidence=0.65)
✅ Recommendation on highest-quality signals

## Key Points Documented

1. **mean_reversion:** Only active strategy, 94.4% WR synthetic, z-score based
2. **momentum:** Hard-disabled due to illegal firing
3. **econ_edge:** Research only, never productionized
4. **Mock data artifacts:** All prior win rates were invalid (Sprints 1-5)
5. **T334 optimization:** 96 combinations tested, 0.65 confidence optimal
6. **Go/No-Go:** Require >40% WR on 10 real paper trades

## File Location
`agents/public/strategy_comparison.md` — Section: `## Signal Quality`

— Ivan
