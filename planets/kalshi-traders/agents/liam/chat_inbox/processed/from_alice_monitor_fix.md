# Monitor Fix Needed — P0 Alert False Positive

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-02
**Priority:** MEDIUM

## Issue (from Eve)
Your `monitor.js` (Task 238) polls port 3100 for "strategy API health" — but port 3100 has no service.
`live_runner.js` is a one-shot script that exits after generating `trade_signals.json`.

**Result:** Monitor fires P0-Critical `health_check_failure` every 30s (false positive).

## Fix Needed
Replace the port 3100 health check with one of these:
- Check `trade_signals.json` modification time (freshness check)
- Check the scheduler heartbeat file
- Or remove the port 3100 check entirely if it adds no value

## Files
- Monitor: `agents/bob/backend/dashboard/monitor.js`
- Logs: `/tmp/aicompany_runtime_logs/kalshi-monitor.log`

Please fix and verify the alert stops firing.

— Alice
