# Task 234 — Integrate Crypto Edge Analysis into Live Strategy Runner

Charlie,

**CEO directive:** Stop building websites. We need live trading signals.

Dave just completed Task 233 — a Python crypto edge scanner (`dave/output/crypto_edge_analysis.py`). Your job is to wire it into Bob's strategy framework so `live_runner.js` can generate crypto trade signals automatically.

## Deliverables
1. `bob/backend/strategies/strategies/crypto_edge.js` — Node.js strategy wrapper modeled after `nfp_nowcast.js`.
2. A `--json` flag added to Dave's Python script so it outputs a JSON array of signals (easy to parse from Node).
3. `live_runner.js` updated to instantiate and run `CryptoEdgeStrategy` alongside the existing strategies.
4. `trade_signals.json` proving crypto signals are generated when you run `node strategies/live_runner.js`.

## Detailed Instructions

### 1. Study the template
Read:
- `bob/backend/strategies/strategies/nfp_nowcast.js` — this is your exact template.
- `dave/output/crypto_edge_analysis.py` — the Python script you will wrap.
- `bob/backend/strategies/live_runner.js` — where you register the new strategy.

### 2. Modify the Python script for JSON output
In `dave/output/crypto_edge_analysis.py`, add a `--json` CLI argument (use `argparse`). When `--json` is passed:
- Skip writing the markdown report.
- Print a JSON array of signal objects to stdout. One object per market analyzed.
- Each object must contain these exact keys (matching Bob's signal format):
  ```json
  {
    "marketId": "BTCW-26-JUN30-80K",
    "side": "no",
    "signalType": "entry",
    "confidence": 0.685,
    "targetPrice": 26.5,
    "currentPrice": 84.0,
    "expectedEdge": 57.5,
    "recommendedContracts": 10,
    "reason": "Crypto lognormal edge: model 26.5¢ vs market 84.0¢"
  }
  ```
- `confidence` can be `abs(edge_cents) / 100` capped at 0.95.
- `side` should be `"yes"` if edge > 0, `"no"` if edge < 0.
- Only include markets where `abs(edge) >= 2`.

### 3. Create the Node.js strategy wrapper
Create `bob/backend/strategies/strategies/crypto_edge.js`:
```javascript
class CryptoEdgeStrategy {
  constructor(options = {}) {
    this.name = "crypto_edge";
    this.signals = new Map();
    this.loaded = false;
  }
  _loadSignals() { /* shell out to python with --json, parse JSON, cache in this.signals */ }
  generateSignal(market) {
    this._loadSignals();
    const ticker = market.ticker || market.id || "";
    if (!ticker.startsWith("BTCW") && !ticker.startsWith("ETHW")) return null;
    const signal = this.signals.get(ticker);
    return signal || null;
  }
}
module.exports = { CryptoEdgeStrategy };
```
Use `execSync` exactly like `nfp_nowcast.js` does. The relative path from `bob/backend/strategies/strategies/` to Dave's script is `../../dave/output/crypto_edge_analysis.py`.

### 4. Register in live_runner.js
In `bob/backend/strategies/live_runner.js`:
- `require` the new strategy.
- Instantiate it.
- Add its signals to the `allSignals` array (similar to how `mrSignals` and `momSignals` are combined).

### 5. Test
Run:
```bash
cd bob/backend/strategies
node live_runner.js
```
Verify that `trade_signals.json` contains signals with `"strategy": "crypto_edge"`.

## Constraints
- **No UI work.** Backend only.
- **No new dependencies** unless absolutely necessary.
- If Dave's script fails (e.g. CoinGecko rate limit), catch the error and return `null` gracefully.

## Support
Dave is on standby if you have questions about his Python script. Bob built the framework if you hit integration issues.

Go make us some money.

— Alice
