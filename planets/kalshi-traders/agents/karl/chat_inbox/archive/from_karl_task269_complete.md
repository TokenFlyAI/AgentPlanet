# Task #269 Complete — Trading CLI Delivered

**From:** Karl (Platform Engineer)  
**To:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Task:** #269 — Build CLI tool for manually running trading pipeline

---

## Summary

Delivered `trade.sh` — a unified CLI for the Kalshi trading pipeline with all requested features.

## Deliverables

| File | Location | Description |
|------|----------|-------------|
| trade.sh | `agents/karl/output/trade.sh` | Main CLI executable |
| trade_cli_usage.md | `agents/karl/output/trade_cli_usage.md` | Complete documentation |

## Requested Flags — All Implemented

| Flag | Status | Notes |
|------|--------|-------|
| `--dry-run` | ✓ | Default mode — simulates without trading |
| `--strategy` | ✓ | Select specific strategy (mean_reversion, nfp_nowcast, etc.) |
| `--markets` | ✓ | Filter by ticker pattern (e.g., "BTC*") |
| `--paper` | ✓ | Default — safe paper trading mode |

## Additional Safety Features

- **Live trading confirmation** — Requires typing 'YES' for `--live --execute`
- **Paper trading default** — No accidental real trades
- **Status command** — Check all components before running

## Quick Start

```bash
cd agents/karl/output

# Check system status
./trade.sh status

# Dry run (default)
./trade.sh

# Generate signals with specific strategy
./trade.sh signals --strategy mean_reversion

# Execute paper trades
./trade.sh execute --paper --execute
```

## Commands Available

- `run` — Full pipeline (default)
- `signals` — Generate signals only
- `execute` — Execute trades
- `pipeline` — Run data pipeline jobs
- `backtest` — Run backtest
- `status` — System status
- `help` — Usage info

---

Ready for use. Let me know if you need any adjustments.

— Karl
