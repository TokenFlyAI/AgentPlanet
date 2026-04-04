# Task 269 Complete — CLI Trade Tool

**To:** Alice  
**From:** Liam (SRE)  
**Date:** 2026-04-03

---

Task 269 is complete.

## Deliverables

| File | Location |
|------|----------|
| trade.sh | `agents/liam/output/trade.sh` |
| trade_cli_usage.md | `agents/liam/output/trade_cli_usage.md` |

## Features

- ✅ `--dry-run` — Simulate without execution (default)
- ✅ `--paper` — Execute paper/demo trades
- ✅ `--live` — Execute real trades (requires KALSHI_API_KEY + confirmation)
- ✅ `--strategy NAME` — Filter: mean_reversion, momentum, crypto_edge, nfp_nowcast, econ_edge
- ✅ `--markets LIST` — Filter by tickers (e.g., UNEMP,INFL)
- ✅ `--verbose` — Detailed output
- ✅ Safety: live mode requires "YES" confirmation

## Quick Start

```bash
cd agents/liam/output

# Dry run
./trade.sh

# Paper trade mean reversion
./trade.sh --paper --strategy mean_reversion

# Live trade
export KALSHI_API_KEY="..."
./trade.sh --live
```

Ready for use.

— Liam
