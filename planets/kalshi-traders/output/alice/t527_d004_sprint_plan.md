# T527: D004 Sprint Plan — Phase Output Audit & Coordination

**Author:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Culture refs:** Following D2 (D004 north star), C6 (reference knowledge.md)

---

## Phase Output Audit Summary

### Phase 1: Market Filtering (Grace) — ⚠️ NEEDS REVALIDATION
- **File:** `agents/public/markets_filtered.json`
- **Status:** Complete — 3 qualifying markets from 8 total
- **Markets:** BTCW-26-JUN30-80K (84%), ETHW-26-DEC31-5K (30%), KXNF-20260501-T200000 (NFP)
- **Issue:** Only 3 markets is thin. T528 asks Bob to validate filter logic + LongshotFading integration.

### Phase 2: LLM Clustering (Ivan) — ⚠️ TOO THIN
- **File:** `agents/public/market_clusters.json`
- **Status:** Complete — only **1 cluster** (crypto: BTC + ETH), 0 hidden correlations
- **Issue:** NFP market not clustered. Zero cross-category correlations found. Ivan needs to expand this with broader market universe + deeper semantic analysis (T529).

### Phase 3: Pearson Correlation (Bob) — 🔴 CRITICAL DATA CHAIN BREAK
- **File:** `agents/public/correlation_pairs.json`
- **Status:** 9 pairs analyzed, 6 arbitrage opportunities found
- **CRITICAL:** Tickers in correlation_pairs.json (SP500-5000, NASDAQ-ALLTIME, BTC-DOM-60, ETH-BTC-RATIO, FED-RATE-DEC, CPI-OVER-4) do **NOT match** Phase 1 output (BTCW-26-JUN30-80K, ETHW-26-DEC31-5K, KXNF-20260501-T200000). Phase 3 is using a completely different market universe than what Phase 1 filtered. **The pipeline chain is broken.**

### Phase 4: C++ Execution Engine (Dave) — ✅ READY
- **Files:** `output/dave/phase4_executor.cpp`, `output/bob/backend/cpp_engine/engine.cpp`
- **Status:** Complete, benchmarked <1ms latency
- **Note:** Engine is downstream; it consumes Phase 3 output. Fix Phase 1-3 chain first.

---

## Critical Issues (Priority Order)

| # | Issue | Severity | Owner | Task |
|---|-------|----------|-------|------|
| 1 | Phase 3 uses markets not in Phase 1 output — data chain broken | CRITICAL | Bob | T528 |
| 2 | Phase 2 only 1 cluster, 0 hidden correlations — needs expansion | HIGH | Ivan | T529 |
| 3 | Phase 1 filter output should be revalidated with updated market data | MEDIUM | Grace | T530 |
| 4 | LongshotFading strategy signal bug | HIGH | Bob | T528 |

---

## Sprint Execution Plan

### Wave 1 (Parallel — Start Immediately)
- **Bob (T528):** Fix LongshotFading signal bug. Then **regenerate correlation_pairs.json using ONLY markets from markets_filtered.json**. The Phase 3 output must consume Phase 2 clusters, which consume Phase 1 markets. No outside tickers.
- **Grace (T530):** Re-run Phase 1 market filter with current market data. Expand market universe if possible (more than 8 input markets). Output updated `markets_filtered.json`. Then validate end-to-end pipeline data flow.

### Wave 2 (After Grace's Phase 1 update)
- **Ivan (T529):** Re-run Phase 2 clustering on Grace's updated `markets_filtered.json`. Find more clusters — the current 1-cluster output is insufficient. Look for cross-category correlations (crypto↔economics, crypto↔politics). Output updated `market_clusters.json`.

### Wave 3 (After Ivan's Phase 2 update)
- **Bob (T528 continued):** Re-run Phase 3 Pearson correlation on Ivan's updated `market_clusters.json`. Verify all tickers trace back to Phase 1. Output validated `correlation_pairs.json`.

### Wave 4 (Validation)
- **Grace (T530 continued):** Backtest the corrected correlation pairs. Validate full pipeline: Phase 1 → 2 → 3 → 4.
- **Alice:** Review all outputs, verify data chain integrity, update knowledge.md.

---

## Blockers
- **T236:** Kalshi API credentials (Founder) — still needed for real market data
- **Contract size confirmation** — Founder action required

---

## Success Criteria
1. All Phase 1-3 output files use consistent ticker symbols
2. Every market in Phase 3 correlation_pairs.json traces back to Phase 1 markets_filtered.json
3. Phase 2 identifies ≥2 clusters with hidden correlations
4. LongshotFading strategy generates valid signals
5. End-to-end backtest produces meaningful results on correlation pairs
