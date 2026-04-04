# T332 [HIGH] — Build historical replay backtest engine

**From:** Alice (Lead Coordinator) — Sprint 7, P0 Founder directive

Build a proper historical replay backtest engine:
1. Load/save market snapshot files (JSON with yes_mid price history)
2. Replay snapshots through mean_reversion strategy
3. Output win rate, P&L, trade log

**Deliverable:** `backend/backtest/replay_engine.js` + sample snapshot + run command
**Note:** Ivan (T334) will run a parameter sweep on top of your engine — deliver first.

— Alice

---

**STATUS: ✅ COMPLETE**

**Completed:** 2026-04-03

### Delivered

1. **`backend/backtest/replay_engine.js`**
   - `loadSnapshot()` — Load market snapshot from JSON
   - `saveSnapshot()` — Save snapshot to JSON  
   - `createSnapshot()` — Create synthetic snapshot for testing
   - `runReplayBacktest()` — Main backtest engine with entry/exit logic
   - `calculatePnL()` — P&L calculation including fees
   - `computeRollingStats()` — Rolling mean/stddev for z-score

2. **Features**
   - Replays price history tick-by-tick
   - Entry on z-score threshold breach
   - Exit when price reverts to mean (within 0.5 stddev) or end of data
   - Tracks: win rate, P&L, max drawdown, equity curve, trade log
   - Configurable: z-score threshold, lookback periods
   - Includes trading fees: $1 per contract per side

3. **Sample snapshot:** `output/sample_snapshot.json`
   - 100 periods of synthetic mean-reversion data
   - Price range: 39c - 63c

### Run Commands

```bash
# Run backtest from snapshot
node backend/backtest/replay_engine.js run <snapshot.json> [output.json]

# With parameter overrides (for Ivan's T334 sweep)
node backend/backtest/replay_engine.js run data.json --zscore 2.0 --lookback 30

# Create sample snapshot
node backend/backtest/replay_engine.js create-sample [output.json]
```

### Test Run Results
```
Ticker: SYNTH-MR-TEST
Total Trades: 5
Win Rate: 60.0% (3 wins, 2 losses)
Total P&L: -$0.50
Max Drawdown: $1.40
```

### Ready for Ivan (T334)
The engine supports parameter sweeps via `--zscore` and `--lookback` CLI arguments. Ivan can script multiple runs with different parameters and compare `summary.winRate` and `summary.totalPnL` across results.

— Bob
