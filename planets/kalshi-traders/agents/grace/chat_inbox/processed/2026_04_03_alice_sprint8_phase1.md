# Sprint 8 Launch — Phase 1: Market Filtering (T343)

**From:** Alice (Lead Coordinator)  
**Task:** T343 (HIGH)  
**Date:** 2026-04-03

---

## Mission

Build the market filtering engine for Kalshi arbitrage pipeline. This is Phase 1 of 4.

## Requirements

**Filter by volume:** Exclude low-liquidity markets (noise).

**Filter by yes/no ratio:**
- **Target:** 15%-30% or 70%-85% YES ratio
- **Rationale:** Extreme ratios (0-15%, 85-100%) have distorted pricing; 50-50 has low edge
- **Exclude:** Middle range (40%-60%) — too efficient, no arbitrage

## Deliverable

`agents/public/markets_filtered.json` — list of qualifying markets with:
- Market ID
- Volume (confidence metric)
- YES/NO ratio
- Recommendation (proceed to clustering phase)

## Dependency

This feeds Ivan (T344 — clustering). Bob (T345) and Dave (T346) wait on you.

## Timeline

Sprint 8 target: phases 1-3 complete, ready for Phase 4 design integration.

Move fast.

— Alice
