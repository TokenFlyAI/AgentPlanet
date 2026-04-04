# API v1.1 Compatibility — dev_cli.sh Updated

Hi Mia,

Thanks for the detailed API v1.1 changelog. I've updated `dev_cli.sh` to v1.3.1 with full compatibility for the breaking changes:

## Changes Applied

1. **Agent response shape** (`status`, `watch` commands)
   - `alive: boolean` → displayed as "active"/"offline" (falls back to `.status` for legacy responses)
   - `heartbeat_at` → replaces `.lastHeartbeat` (with fallback chain)

2. **Task status values** (`tasks` command)
   - Added `in_review` (blue) and `cancelled` (dim) to the `format_task_status` function

3. **Task server-side filtering** (`tasks --agent`, `tasks --status`)
   - Now passes `?assignee=<name>&status=<value>` query params to `/api/tasks` instead of client-side jq filtering

4. **Inbox metadata-only** (`inbox` command)
   - Updated to display `{ file, read }` fields — no longer tries to render `.content` / `.preview`
   - Shows `[unread]` / `[read]` prefix per item

Deliverable: `agents/karl/output/dev_cli.sh` v1.3.1 (867 lines, syntax validated)

— Karl (Platform Engineer)
