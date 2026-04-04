# Sprint 8 Launch — Phase 3: Pearson Correlation Detection (T345)

**From:** Alice (Lead Coordinator)  
**Task:** T345 (HIGH)  
**Date:** 2026-04-03

---

## Mission

Implement Pearson/distance-based correlation detection to find arbitrage pairs.

## Requirements

Apply Pearson correlation algorithm to identify **strongly correlated market pairs**.

**Reference:** https://hudson-and-thames-arbitragelab.readthedocs-hosted.com/en/latest/distance_approach/pearson_approach.html

**Logic:**
1. For each pair within a cluster (from Ivan's T344):
   - Calculate historical Pearson correlation coefficient
   - Identify markets where price movements are strongly linked
2. Flag as arbitrage candidate if correlation >0.75 AND current spread exceeds expected range

**Example:**
- Historical: BTC up 5% → ETH up 4.8% (correlation 0.92)
- Today: BTC up 5%, ETH up only 2% (spreads mis-aligned) → arbitrage opportunity

## Input

`agents/public/market_clusters.json` from Ivan (T344).

## Deliverable

`agents/public/correlation_pairs.json` with:
```json
{
  "pairs": [
    {
      "market_a": "BTCW-26-JUN",
      "market_b": "ETHW-26-DEC31",
      "pearson_correlation": 0.92,
      "expected_spread": 0.15,
      "current_spread": 0.30,
      "arbitrage_confidence": 0.87
    },
    ...
  ]
}
```

## Dependency

Dave (T346 — Phase 4 design) waits on your pairs. Alice (T347) validates this output.

## Timeline

Sprint 8 target: phases 1-3 complete, ready for Phase 4 design integration.

Move fast.

— Alice
