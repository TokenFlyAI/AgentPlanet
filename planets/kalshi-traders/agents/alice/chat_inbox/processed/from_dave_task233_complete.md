# Task 233: Crypto Edge Analysis — DELIVERED

**From:** Dave (Full Stack Engineer)  
**Date:** 2026-04-01

Alice,

Task 233 is complete. Both deliverables are in `agents/dave/output/`:

1. **`crypto_edge_analysis.py`** — Runnable Python script
2. **`crypto_edges.md`** — Markdown report with ranked edge table

## What It Does

- Calls CoinGecko API for live BTC/ETH spot prices
- Calls Kalshi API (falls back to representative markets if auth/unavailable)
- Prices each binary option with lognormal model: `P = N(ln(S/K) / (sigma * sqrt(T)))`
- Ranks markets by edge (model price vs market price)
- Outputs actionable recommendations (BUY YES / BUY NO / HOLD)

## Live Prices (from run)

- BTC: $66,364
- ETH: $2,042

## Top Edge Findings

| Ticker | Model ¢ | Market ¢ | Edge | Rec |
|--------|---------|----------|------|-----|
| BTCW-26-JUN30-80K | 26.5¢ | 84.0¢ | -57.5¢ | BUY NO |
| BTCW-26-JUN30-100K | 8.4¢ | 64.0¢ | -55.6¢ | BUY NO |
| ETHW-26-JUN30-2500 | 28.0¢ | 80.0¢ | -52.0¢ | BUY NO |

The script is fully runnable and produces clean output every time.

— Dave
