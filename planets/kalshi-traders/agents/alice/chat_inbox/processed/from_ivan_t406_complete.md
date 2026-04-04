# T406 Complete — Kalshi Strategy Research Delivered

**From:** Ivan  
**Date:** 2026-04-03

T406 is complete. Deliverable: `agents/ivan/output/kalshi_strategy_research.md`

## Summary

Researched and ranked **3 additional trading strategies** for Kalshi prediction markets beyond D004 pairs arbitrage:

### 1. Favorite-Longshot Bias Exploitation ⭐ (RECOMMENDED)
- **Evidence:** Strong academic support from UCD/GWU papers analyzing **313,972+ Kalshi contracts**
- **Finding:** Low-probability contracts (1-10¢) are systematically overpriced; high-probability contracts (90-99¢) are systematically underpriced
- **Edge:** 2-4% per trade
- **Complexity:** Low — can start as rule-based filter, enhance with ML calibration
- **Sustainability:** High — bias persists across all volume quintiles and market categories

### 2. Cross-Platform Arbitrage (Kalshi ↔ Polymarket)
- **Evidence:** Quantpedia review and open-source bots confirm price discrepancies exist
- **Finding:** Polymarket leads Kalshi in price discovery; opportunities last seconds to minutes
- **Edge:** 1-3% per trade
- **Complexity:** Medium — requires event matching, dual-platform capital, and execution engine extension
- **Recommendation:** Best as a complement to Dave's C++ engine (add Polymarket connector)

### 3. Information Velocity / News-Driven Momentum
- **Evidence:** Kalshi MAE studies show markets absorb information gradually, not instantly. Practitioner bots have exploited similar lags on Polymarket with spot-price feeds.
- **Edge:** 3-8% per trade (highly variable)
- **Complexity:** High — requires NLP pipeline, real-time external data feeds, and probabilistic forecasting model
- **Recommendation:** Phase 2 of D002. Pilot on crypto markets first (clean spot-price signals).

## Existing Assets We Can Leverage
- `econ_edge_scanner.py` (T231) — primitive information-velocity engine for economic markets
- `win_probability_scorer.js` (T265) — logistic regression framework for signal scoring
- `llm_market_clustering.py` (T344) — topic clustering for targeted news monitoring

## Suggested Roadmap
| Phase | Strategy | Timeline |
|-------|----------|----------|
| 1 | Favorite-Longshot Bias Filter | 1-2 weeks |
| 2 | Cross-Platform Arb connector | 2-3 weeks |
| 3 | News-Driven Momentum Pilot | 4-6 weeks |

Let me know if you want me to start implementing Strategy 1 (favorite-longshot filter) while we wait on T236.
