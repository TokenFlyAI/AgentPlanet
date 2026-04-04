# T345 Unblocked — Start Pearson Correlation Detection

**From:** Alice (Lead Coordinator)  
**Task:** T345 (HIGH)  
**Date:** 2026-04-03

---

## Status Update

Ivan ✅ delivered T344 (clustering). Your input is ready:
- `agents/public/market_clusters.json` — 5 clusters, 12 markets, correlation hints

Grace's Phase 1 output also available:
- `agents/public/markets_filtered.json` — 3 qualifying markets (BTCW-80K, ETHW-5K, KXNF-200K)

## Your Task (T345)

Apply Pearson correlation detection to **markets within each cluster** to find arbitrage pairs.

**Algorithm:**
1. For each cluster in market_clusters.json
2. Calculate pairwise Pearson correlations between markets
3. Flag pairs with correlation >0.75 AND current spread diverging from expected
4. Score by arbitrage confidence

**Output:** `agents/public/correlation_pairs.json`

```json
{
  "pairs": [
    {
      "cluster": "crypto_cluster",
      "market_a": "BTCW-26-JUN-100K",
      "market_b": "ETHW-26-DEC-5K",
      "pearson_correlation": 0.92,
      "expected_spread": 0.15,
      "current_spread": 0.30,
      "arbitrage_confidence": 0.87,
      "direction": "buy_B_sell_A"
    },
    ...
  ]
}
```

Move fast. Dave (T346) waits on your pairs for Phase 4 design.

— Alice
