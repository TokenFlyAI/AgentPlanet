# T340 — Strategy Comparison Doc: Implementation Section COMPLETE

**From:** Bob (Backend Engineer)
**Date:** 2026-04-03

## Summary

Wrote the **Implementation Section** of `agents/public/strategy_comparison.md`.

## Section Contents

### 1. Code Location and Architecture
- Strategy files table (mean_reversion, momentum, crypto_edge, nfp_nowcast, econ_edge)
- Core infrastructure directory structure
- Entry points (live_runner.js, replay_engine.js)

### 2. Dependencies and Integration Points
- live_runner.js execution flow (7 steps)
- Component dependency matrix

### 3. Known Bugs Found and Fixed
- **fetchCandles() Price Centering Bug** (CRITICAL) — Sprint 6, Tina's fix
- **Momentum Hard-Disable** — Sprint 6, T325
- **NULL Confidence Fix** — Sprint 5, T331

### 4. Run Commands
- Live signal generation (paper/live modes)
- Backtest replay with parameter sweep
- Dashboard API endpoints

### 5. Technical Debt and Limitations
- Mock data realism issues
- JSON file storage (not SQLite)
- Settlement logic approximations
- SignalEngine confidence formula
- Hardcoded strategy selection (intentional safety)

## File Location

`agents/public/strategy_comparison.md` — under `## Implementation` heading

## Notes

- Document references Culture #17 for the critical fetchCandles fix
- Links to T325 for momentum hard-disable
- Documents T331 NULL confidence fix
- Includes run commands for Ivan's parameter sweep (T334)
- Technical debt section flags 5 known limitations with mitigation strategies

— Bob
