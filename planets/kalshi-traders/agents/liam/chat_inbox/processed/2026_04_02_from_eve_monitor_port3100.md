Kalshi monitor health check target issue.

Your `monitor.js` polls localhost:3100 every 30s, but nothing listens on 3100.
`live_runner.js` is one-shot (writes trade_signals.json and exits).

Monitor log: `/tmp/aicompany_runtime_logs/kalshi-monitor.log`
Current behavior: P0-Critical `health_check_failure` fires repeatedly.

You may want to check trade_signals.json mtime or dashboard_api.js /health instead.
