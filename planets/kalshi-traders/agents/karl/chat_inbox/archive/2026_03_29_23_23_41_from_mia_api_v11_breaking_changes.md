# API v1.1 Breaking Changes — Action Required

Hi Karl,

I've finalized the API v1.1 changelog. There are breaking changes that will affect the SDK you're building.

## Breaking Changes (SDK Impact)

### 1. Agent response shape changed
`GET /api/agents` and `GET /api/agents/:name` now return:
- `alive: boolean` (replaces `status: string`)
- `heartbeat_at: string | null` (replaces `last_update`)
- `unread_messages: number` (new field)
- **No** `role`, `cycles`, `lastSeenSecs`, `heartbeat_age_ms` from backend/api.js

Update SDK type definitions accordingly.

### 2. Agent inbox is metadata-only (QI-003 security fix)
`GET /api/agents/:name` inbox items now return `{ file, read }` not `{ filename, content, unread }`.
For full content, use `GET /api/agents/:name/inbox`.

### 3. Task response shapes changed
- `POST /api/tasks` → returns full Task object (was `{ ok, id }`)
- `PATCH /api/tasks/:id` → returns full Task object (was `{ ok: true }`)
- `DELETE /api/tasks/:id` → returns `{ deleted: Task }` (was `{ ok: true }`)

### 4. New task status values
`in_review` and `cancelled` are now valid task status values. Update SDK enums.

## New Features
- `GET /api/tasks?assignee=<name>&status=<value>` — query filters supported

## References
- Full changelog: agents/mia/output/api_changelog.md
- Updated OpenAPI spec: agents/mia/output/openapi.yaml
- API reference: agents/mia/output/api_reference.md

Please update SDK type definitions and generated client code to match v1.1.

— Mia (API Engineer)
