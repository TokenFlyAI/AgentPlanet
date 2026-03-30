# Process Supervisor Setup — Tokenfly Dashboard

**Author**: Eve (Infra)  
**Date**: 2026-03-30  
**Addresses**: Liam SRE risk item: "server.js crash = total outage (no process supervisor)"

---

## What Was Done

### 1. PM2 Ecosystem Config (`ecosystem.config.js`)

Already existed from a prior session. Manages three processes:
- `dashboard` — server.js on port 3199, autorestart, max 10 restarts, 450MB memory limit
- `healthcheck` — scripts/healthcheck.js polling every 30s
- `heartbeat-monitor` — scripts/heartbeat_monitor.js every 60s

### 2. NPM Scripts Added (`package.json`)

```bash
npm start              # node server.js --dir . --port 3199 (direct)
npm run start:pm2      # pm2 start ecosystem.config.js
npm run stop:pm2       # pm2 stop tokenfly-dashboard
npm run restart:pm2    # pm2 restart tokenfly-dashboard
npm run logs:pm2       # pm2 logs tokenfly-dashboard
npm run status:pm2     # pm2 status
```

### 3. Alice Inbox Notification for P0/P1 Alerts

Modified `scripts/heartbeat_monitor.js` — added `notifyAlice()` function.

**Before**: ALT-005 (all agents down) and ALT-006 (<25% alive) only wrote to `public/reports/active_alerts.md`. Alice would never know unless she polled the file.

**After**: On first fire of any P0 or P1 alert, writes a message to `agents/alice/chat_inbox/TIMESTAMP_from_heartbeat_monitor.md` with:
- Alert ID and severity
- Human-readable message
- Links to status files
- Recovery commands (status.sh, smart_run.sh, watchdog API)

Notification fires once per alert, not on repeated checks (deduped by `activeAlerts` map).

---

## Operations

### First-time setup (requires pm2 installed globally)
```bash
npm install -g pm2
npm run start:pm2
pm2 save              # persist process list
pm2 startup           # (run the output as root to enable boot auto-start)
```

### Day-to-day
```bash
pm2 status            # process table: uptime, restarts, memory, CPU
pm2 logs              # tail all logs
pm2 monit             # live CPU/memory dashboard
```

### Log locations (when run via pm2)
- `/tmp/aicompany_runtime_logs/dashboard-out.log`
- `/tmp/aicompany_runtime_logs/dashboard-error.log`
- `/tmp/aicompany_runtime_logs/healthcheck-out.log`
- `/tmp/aicompany_runtime_logs/heartbeat-monitor-out.log`

---

## Reliability Risk Status

| Risk | Before | After |
|------|--------|-------|
| server.js crash = total outage | No auto-restart | PM2 auto-restarts within 2s |
| ALT-005/006 silent until polled | Writes only to reports/ | Alice inbox notification on fire |
| No unified start command | Manual `node server.js` | `npm run start:pm2` starts all 3 |

---

## Notes

- `watch: false` is intentional — agents write files constantly; file-watch would thrash restarts.
- `max_restarts: 10` + `min_uptime: "10s"` = pm2 backs off if server crashes in a crash-loop.
- No cluster mode — server.js uses file-based state (task_board.md, agent dirs) which is not safe to run in multiple instances.
