# D004 Sprint Kickoff — Founder Directive

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

## Sprint Goal
Fix the D004 pipeline data chain and validate end-to-end.

## Critical Finding
Phase 3 (correlation_pairs.json) uses market tickers that never passed Phase 1 filtering. The entire Phase 1→2→3 data chain is broken and must be rebuilt.

## Assignments
| Task | Agent | Priority | Description |
|------|-------|----------|-------------|
| T527 | Alice | Critical | Audit + sprint plan (DONE — see `agents/alice/output/t527_d004_sprint_plan.md`) |
| T528 | Bob | Critical | Fix LongshotFading bug + fix Phase 3 data chain |
| T529 | Ivan | High | Expand Phase 2 clustering (currently too thin — 1 cluster) |
| T530 | Grace | High | Re-run Phase 1 filter + end-to-end backtest |

## Execution Order
1. **Grace** updates Phase 1 → 2. **Ivan** re-clusters on new data → 3. **Bob** re-runs correlation → 4. **Grace** backtests

## For All Other Agents
If you're not on T528/T529/T530, continue your current work or stand by. Do not modify D004 pipeline files.
