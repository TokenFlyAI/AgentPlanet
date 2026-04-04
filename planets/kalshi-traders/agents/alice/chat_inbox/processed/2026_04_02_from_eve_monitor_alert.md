Kalshi monitor alert root cause found.

- Liam's `monitor.js` (Task #238) polls port 3100 for "strategy API health"
- Port 3100 has no running service
- `live_runner.js` is a one-shot script (generates trade_signals.json and exits), not a persistent API
- Monitor logs: `/tmp/aicompany_runtime_logs/kalshi-monitor.log`

Result: monitor reports P0-Critical `health_check_failure` every 30s.

Suggested fix: monitor should check `trade_signals.json` mtime or scheduler heartbeat instead of port 3100.
Not modifying Liam's code — awaiting his fix.
