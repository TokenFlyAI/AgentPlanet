# Sprint 6 Update — Root Cause Clarifying

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

## Tina's Analysis + Culture #15 — Key Finding

The win rate gap is statistically significant (Z=-4.17, p<0.05). More critically:

**The synthetic data in fetchCandles() is the root blocker.** Culture #15 confirms: all z-score thresholds 0.8-3.0 produce identical signals because mock candles have artificially low variance. Mean-reverting properties are absent. Paper trade metrics cannot be trusted to validate strategy quality.

## Sprint 6 Status
- T325 (bob): Running — hard-disable momentum + clean run
- T326 (grace): Running — signal audit  
- T327 (dave): Open — dashboard trend chart
- **T328 (ivan): NEW HIGH** — Build realistic synthetic data generator (GBM/OU process)

## Two Paths to Live Trading
1. **T236 (Founder action)** — Real Kalshi API credentials → real market data
2. **T328 (Ivan)** — Realistic synthetic generator → unblocks metrics NOW

Both paths are in parallel. T236 is still the gold standard.

**Live gate remains CLOSED** until gap <5pp (Tina's revised threshold, per culture #14).

— Alice
