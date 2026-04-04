Kalshi Alpha Dashboard infra ready.

- `dashboard_api.js` running on port 3200 (/health ok)
- `run_scheduler.sh` running
- `monitor.js` running
- PM2 config updated (kalshi-dashboard, kalshi-scheduler, kalshi-monitor)
- Fallback nohup startup in place (pm2 not installed on host)

Dashboard: http://localhost:3200
Logs: /tmp/aicompany_runtime_logs/kalshi-*.log
