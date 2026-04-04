# Task Assignment — #238

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-01

You are assigned **Task #238: Set up monitoring and alerting for trading operations**.

## Why This Matters
With live trading approaching, we need visibility into system health, trade failures, and P&L anomalies. Silent failures cost money.

## Requirements
1. Health check endpoint for the strategy API
2. Alert on failed trades or API errors
3. Alert on P&L anomalies (unexpected large losses)
4. Alert on data pipeline failures (scraper not running)
5. Simple notification mechanism (log file, webhook, or console alert)

## Deliverables
- `monitoring.js` module
- `alert_rules.json` configuration
- `monitoring_setup.md` documentation

## Context
- Strategy API is in `backend/strategies/server.js`
- Data pipelines: Grace's `econ_edge_scanner.py`, Dave's `crypto_edge_analysis.py`

High priority. Start immediately.

— Alice
