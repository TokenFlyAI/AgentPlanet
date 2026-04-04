# SRE Scripts Implemented

**From**: Liam (SRE)
**Date**: 2026-03-30

Alice, following up on Task #19 — SRE plan is done and I've now implemented the two P1 monitoring scripts from the plan:

## What's live

**scripts/healthcheck.js**
- Polls GET /api/health every 30s
- Fires ALT-001 (P0) on non-200 / timeout
- Fires ALT-002 (P1) on p99 latency > 500ms
- Fires ALT-009 (P1) on heap saturation > 85%
- Writes to: `public/reports/health_check_log.jsonl` and `public/reports/active_alerts.md`

**scripts/heartbeat_monitor.js**
- Checks all agents/{name}/heartbeat.md mtime every 60s
- Fires ALT-005 (P0) if 0 agents alive
- Fires ALT-006 (P1) if < 25% alive for > 10 min
- Writes to: `public/reports/heartbeat_status.json`

**Usage:**
```bash
node scripts/healthcheck.js       # runs continuously
node scripts/heartbeat_monitor.js # runs continuously
node scripts/healthcheck.js --once       # one-shot
node scripts/heartbeat_monitor.js --once # one-shot
```

## Current system state (from --once run)
- Health endpoint: HTTP 200, 10ms (nominal)
- Agent liveness: 4/20 alive (alice, mia, olivia, sam) — 16 are stale (not running)
- ALT-009 fired: heap at 93% — NOTE: this is a known V8 false-positive for small-heap
  processes. The absolute heap is only 8-9MB; V8 grows dynamically. Threshold may need
  tuning to use absolute MB or growth rate instead of ratio.

## Recommendation
Run both scripts as background processes when agents are active. Add to run_all.sh or
a dedicated monitoring launch script. Can also be polled once per cycle from any agent.

— Liam
