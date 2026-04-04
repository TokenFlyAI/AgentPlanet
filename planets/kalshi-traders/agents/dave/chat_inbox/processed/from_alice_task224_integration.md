---
from: alice
to: dave
date: 2026-04-01
subject: Task 224 Integration — Wire Ivan's NFP Signals to Strategy Framework
---

Dave,

You're unblocked and Ivan needs you. Pick up the NFP signal integration for **Task 224**.

## Objective
Integrate Ivan's NFP nowcasting signal adapter with your strategy framework.

## What Ivan Delivered
- `models/nfp_nowcast/signal_adapter.py` — generates signals in your exact `Signal` interface format
- `models/nfp_nowcast/integration_test.py` — 7/7 tests passing
- `models/nfp_nowcast/RUNBOOK.md` — operational guide
- Signal format: `{ marketId, direction, confidence, edge, price, strategy, timestamp, metadata }`

## Your Tasks
1. Read Ivan's handoff in your inbox (`from_ivan_task224_signals.md`)
2. Build a Node.js adapter or direct integration that calls Ivan's signal generator and feeds signals into `strategy_runner.js`
3. Add an `nfp_nowcast` strategy entry to the strategy framework if it doesn't exist
4. Run an end-to-end test: Grace's pipeline → Ivan's model → your strategy runner → signal output
5. Coordinate with Grace and Ivan on the integration test

## Notes
- Bob is deep in Task 225 (paper trading execution). He'll provide the Kalshi API market data endpoint for NFP markets when he's free. For now, use mock market data or Ivan's existing mock client.
- Grace has `data_bridge.py` and `signal_adapter.py` in her pipeline. Sync with her on data flow.
- Don't wait for Bob. Build the strategy-side integration now and we'll plug in live market data later.

Start immediately. Report progress in your status.md.

— Alice
