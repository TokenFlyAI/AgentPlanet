# PM2 Process Supervisor — Setup Guide

**Author:** Eve (Infra)  
**Date:** 2026-03-30  
**Risk addressed:** Liam SRE Plan §10 — "server.js process crash = total outage (no supervisor)" [High]

## What was created

`ecosystem.config.js` at the project root defines 3 managed processes:

| Name | Script | Purpose |
|------|--------|---------|
| `dashboard` | server.js --port 3199 | Main Tokenfly dashboard + API |
| `healthcheck` | scripts/healthcheck.js | Synthetic health poll every 30s (ALT-001/002/009) |
| `heartbeat-monitor` | scripts/heartbeat_monitor.js | Agent liveness check every 60s (ALT-005/006) |

## Quick Start

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start all three processes
pm2 start ecosystem.config.js

# Verify they're running
pm2 status

# View live logs
pm2 logs

# Live monitor (CPU, memory, restarts)
pm2 monit
```

## Auto-restart on server reboot

```bash
# Save current process list
pm2 save

# Generate and install startup script (macOS / Linux)
pm2 startup
# Run the command it prints (requires sudo)
```

## Key behaviors

- **Max memory 450MB**: dashboard restarts automatically if heap exceeds 450MB (SLO threshold is 400MB — gives 50MB margin)
- **Max 10 restarts**: avoids infinite restart loop on fatal errors
- **Min uptime 10s**: a crash within 10s of start counts as a failed restart
- **Logs**: all logs go to `/tmp/aicompany_runtime_logs/` (same directory as agent cycle logs)
- **`watch: false`**: file watching disabled — agents write status/heartbeat files constantly, which would trigger unwanted restarts

## Managing individual processes

```bash
pm2 restart dashboard          # Rolling restart
pm2 stop healthcheck           # Stop without removing
pm2 delete heartbeat-monitor   # Remove from pm2 list
pm2 start ecosystem.config.js --only dashboard  # Start just one app
```

## Comparison to alternative: node --watch

| | PM2 | node --watch |
|-|-----|-------------|
| Auto-restart on crash | ✓ | ✗ |
| Memory limit | ✓ (max_memory_restart) | ✗ |
| Manages multiple processes | ✓ | ✗ |
| Log management | ✓ | ✗ |
| System startup integration | ✓ (pm2 startup) | ✗ |
| Zero npm install if already global | — | ✓ |

PM2 is strongly preferred for production. For local dev, `node server.js --dir . --port 3199` remains fine.

## References

- Liam's SRE plan: `agents/liam/output/sre_plan.md` §10, §11
- Alert thresholds: ALT-001 through ALT-010 in sre_plan.md §3
