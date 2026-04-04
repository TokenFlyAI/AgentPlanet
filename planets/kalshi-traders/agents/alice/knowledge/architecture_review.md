# Architecture Review — Tokenfly Agent Team Lab
**Author:** Alice (Acting CEO / Tech Lead)
**Date:** 2026-03-29
**Task:** Alpha task (#1)

---

## Current System Architecture

### Component Map

```
aicompany/
├── server.js              (1155 lines) — monolithic HTTP server, main entry point
├── index_lite.html        — Frontend dashboard (single-page, SSE-driven)
├── public/
│   ├── task_board.md      — Shared task board (file-based)
│   ├── company_mode.md    — Operating mode state
│   ├── announcements/     — Team broadcast messages
│   ├── reports/           — Velocity + quality reports
│   ├── sops/              — Mode-specific SOPs
│   └── team_directory.md  — Agent roster
├── agents/
│   └── {name}/
│       ├── status.md      — Agent memory (persists across cycles)
│       ├── heartbeat.md   — Liveness signal
│       ├── chat_inbox/    — Inbound messages
│       ├── persona.md     — Agent identity + work cycle
│       └── output/        — Agent deliverables
└── backend/               — NEW: Bob's REST API module (not yet integrated)
    ├── api.js             — REST endpoints (agents, tasks, messages)
    └── api.test.js        — 13 test suite
```

### Bob's Unintegrated Output
```
agents/bob/output/
├── backend-api-module.js  — Production middleware (rate limit, validator, metrics)
├── test-backend-module.js — 27/27 tests passing
└── agent_metrics_api.js   — Agent metrics aggregator
```

---

## How the System Works

### Data Layer
- **File-system only** — no database. All state in `.md` files.
- Agent state: `agents/{name}/status.md`, `heartbeat.md`
- Tasks: `public/task_board.md` (pipe-delimited markdown table)
- Messages: `agents/{name}/chat_inbox/*.md` (files = messages)
- Mode: `public/company_mode.md`

### Server Layer (`server.js`)
- Zero-dependency Node.js HTTP server
- Serves `index_lite.html` as the dashboard
- SSE endpoint for real-time agent health updates (polls heartbeat/status mtimes every 3s)
- REST API routes for agent data, task CRUD, messaging
- Agent process management (start/stop agents)
- Cost tracking from log files

### Frontend Layer (`index_lite.html`)
- Single-page dashboard
- SSE-connected for live updates
- Tabs: Agents, Tasks, Team Channel, CEO Inbox
- Agent cards with heartbeat, status, cost data

### Agent Layer
- Each agent is a Claude Code instance running in its own directory
- Agents communicate via file-based messaging (write to each other's `chat_inbox/`)
- Agent lifecycle: read → decide → act → save to status.md → update heartbeat.md
- Scripts: `run_agent.sh`, `stop_agent.sh`, `run_all.sh`, `run_subset.sh`

---

## Integration Gaps (Current)

| Gap | Impact | Owner | Task |
|-----|--------|-------|------|
| `backend/api.js` not mounted in `server.js` | New REST endpoints unreachable | Dave | #4 |
| `backend-api-module.js` middleware not active | No rate limiting, no request validation, metrics not tracked | Dave | #4 |
| `agent_metrics_api.js` endpoint not served | Metrics API unavailable | Dave | #4 |
| Task board has no description for Task #1 | Alice working blind | Alice | Fixed this cycle |

---

## Architecture Strengths

1. **Zero dependencies** — portable, no npm install required for the server
2. **File-based communication** — simple, auditable, no message broker needed at this scale
3. **SSE for real-time** — lightweight push without WebSocket complexity
4. **Modular agent structure** — each agent is self-contained, easy to add/remove

## Architecture Weaknesses

1. **Monolithic server.js** (1155 lines) — growing fast, needs modularization
2. **No rate limiting yet** — Bob built it, but not wired in (security risk)
3. **No input validation on APIs** — Bob built it, but not wired in
4. **File lock risk** — concurrent agent writes to the same files (task_board.md) could corrupt data
5. **No authentication** — dashboard is open to anyone on the network
6. **Task board is a markdown table** — brittle for concurrent updates; consider JSON format

---

## Q2 Tech Roadmap (Recommended)

### Immediate (this sprint)
- [ ] **Task #3** — Tina: QA review Bob's backend deliverables
- [ ] **Task #4** — Dave: Integrate backend-api-module into server.js
- [ ] **New** — Heidi: Security audit of dashboard (no auth, open API endpoints)
- [ ] **New** — Mia: API design review — consolidate `server.js` endpoints + `backend/api.js` into coherent spec

### Near-term
- [ ] Refactor `server.js` into modules — route handlers, SSE, agent management, file ops
- [ ] Switch task board from markdown table to JSON (Pat: database/schema work)
- [ ] Add file locking for concurrent writes (Bob/Rosa)
- [ ] Add authentication layer for dashboard (Heidi)

### Medium-term
- [ ] Agent health alerting — auto-escalate stale agents to Alice/CEO (Liam: SRE)
- [ ] Performance baseline — load test the server under 20 concurrent agents (Nick)
- [ ] CI/CD pipeline for server.js changes (Eve)

---

## Key Decisions Made This Cycle

1. **Task #4 (integration) assigned to Dave** — he's full-stack, right fit for wiring Bob's module into server.js
2. **QA before integration** — Tina reviews Bob's work (Task #3) before Dave integrates (Task #4). This prevents integrating broken code.
3. **Alpha task self-defined** as architecture review — fills the gap from missing CEO description

---

## Open Questions for CEO

1. Is there a product roadmap I should be building the task board from?
2. Should we prioritize the dashboard (frontend) or the backend API surface next?
3. Any Q2 milestones I should be planning around?
