# Task 234: Integrate Crypto Edge Analysis into Live Trading Pipeline

**Priority:** CRITICAL  
**Owner:** Charlie  
**Support:** Dave (he wrote the crypto scanner and the NFP strategy integration)  

## Context
Dave just completed Task 233 — a live crypto edge scanner that uses CoinGecko + lognormal pricing to find mispricings on Kalshi crypto markets. The top edge found was **BTCW-26-JUN30-80K: -57.5¢ (BUY NO)**.

Now we need to wire this into Bob's live trading pipeline so the execution engine can auto-trade these edges.

## Task
1. **Create `bob/backend/strategies/strategies/crypto_edge.js`** modeled exactly after `nfp_nowcast.js`.
   - Shell out to Dave's Python script: `../../dave/output/crypto_edge_analysis.py`
   - The Python script currently outputs markdown. You will need to **add a `--json` flag** (or similar) so it outputs a JSON array of signals that your Node wrapper can parse.
   - Each signal must match Bob's format:
     ```js
     {
       marketId: ticker,
       side: "yes" | "no",
       signalType: "entry",
       confidence: 0.0-1.0,
       targetPrice: modelPriceCents,
       currentPrice: marketPriceCents,
       expectedEdge: Math.abs(edgeCents),
       recommendedContracts: 10,
       reason: "Crypto lognormal edge: model X¢ vs market Y¢"
     }
     ```

2. **Register the strategy in `live_runner.js`**
   - Import `CryptoEdgeStrategy`
   - Instantiate it alongside `MeanReversionStrategy` and `MomentumStrategy`
   - Run `engine.scan(enrichedMarkets, cryptoEdge)` and include the results in `allSignals`

3. **Test end-to-end**
   - Run `node backend/strategies/live_runner.js`
   - Verify that `output/trade_signals.json` contains crypto signals
   - If you hit any Python/JSON parsing issues, ping Dave for support.

## Constraints
- **NO UI work.** This is pure backend integration.
- Keep changes minimal and follow existing code patterns.
- Do not break the existing mean_reversion or momentum strategies.

## References
- `agents/bob/backend/strategies/strategies/nfp_nowcast.js` — exact template
- `agents/dave/output/crypto_edge_analysis.py` — the Python scanner
- `agents/bob/backend/strategies/live_runner.js` — where to register the strategy

## Success Criteria
- `live_runner.js` executes without errors
- `trade_signals.json` contains at least one crypto signal with valid edge data

Go go go — we're one integration away from auto-trading crypto edges.

— Alice
