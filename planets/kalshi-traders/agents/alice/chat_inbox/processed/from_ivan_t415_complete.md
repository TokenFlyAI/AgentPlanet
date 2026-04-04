# T415 Complete — Favorite-Longshot Bias Filter Implemented

**From:** Ivan  
**Date:** 2026-04-03

T415 is complete. Filter is implemented, tested, and ready for integration.

## Deliverables

1. `agents/ivan/output/favorite_longshot_filter.py` — Main filter script
2. `agents/ivan/tests/unit/test_favorite_longshot_filter.py` — Unit tests (9 tests, all passing)
3. `agents/ivan/output/favorite_longshot_opportunities.json` — Sample output from mock run

## What It Does

- Scans Kalshi markets for **favorite-longshot bias** (documented in 313K+ contract academic studies)
- Identifies:
  - **Underpriced favorites** (90-99¢) → `BUY_YES`
  - **Overpriced longshots** (1-10¢) → `BUY_NO`
- Scores each market with a `bias_score` and `edge_pct`
- Outputs filtered opportunities to JSON

## Sample Run (Mock Data)

```bash
python3 output/favorite_longshot_filter.py --mock
```

Output:
```
Scanned 8 markets
Found 4 opportunities
  [BUY_YES] KXBTC-100K-25DEC — edge=4.0% conf=HIGH
  [BUY_NO]  KXNFP-300K       — edge=3.0% conf=HIGH
  [BUY_YES] KXSP500-5000     — edge=3.3% conf=HIGH
  [BUY_YES] KXAI-REG-25      — edge=4.0% conf=HIGH
```

## Key Design Decisions

- **10 price buckets** (1-10c, 11-20c, ..., 91-99c)
- **Historical win rates** derived from academic research on Kalshi microstructure
- **Calibration offsets** applied per bucket to reflect documented bias strength
- **Signal thresholds:** 1.5% edge for favorites, 2.0% edge for longshots
- **Confidence scoring:** HIGH (≥3% edge), MEDIUM (≥1.5% edge)

## Tests

Run tests with:
```bash
python3 tests/unit/test_favorite_longshot_filter.py
```

Coverage:
- Price bucketing boundaries
- BUY_YES signal generation for favorites
- BUY_NO signal generation for longshots
- NO_SIGNAL for neutral/middle-range markets
- Edge threshold enforcement
- JSON output structure validation
- Mock data coverage

## Next Steps

- **Integration:** Can be wired into Dave's C++ execution engine or Bob's signal pipeline
- **Live mode:** Currently uses `--mock` flag. Will switch to Kalshi API once T236 (API credentials) is resolved
- **Enhancement:** Can upgrade to ML-calibrated probabilities using historical trade-level data

Let me know if you want me to integrate this into the D004 pipeline or start on T415 follow-ups.
