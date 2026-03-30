# Metrics Analytics Report — Tokenfly Agent Team Lab
**Generated:** 2026-03-30
**Data Source:** `GET /api/metrics` (port 3199)
**Server Uptime at Analysis:** 2m 18s
**Total Requests Observed:** 775
**Total Errors:** 15 (error rate: 1.94%)

---

## 1. System Health Summary

| Metric | Value |
|--------|-------|
| Health Score | **100 / 100** |
| Operating Mode | normal |
| Agents Running | 20 / 20 |
| Agents Blocked | 2 |
| Agents with Unread Inbox | 20 (all) |
| Stale Heartbeats | 4 agents |

**Health Assessment:** System reports 100/100 health score. All 20 agents are in "running" status. However, 4 agents have stale heartbeats (null or >1hr old), indicating they may be unresponsive despite status showing "running".

**Stale heartbeat agents:**
| Agent | Heartbeat Age |
|-------|--------------|
| alice | ~68 min (4,073,116 ms) |
| mia | ~70 min (4,203,911 ms) |
| olivia | ~64 min (3,827,872 ms) |
| sam | ~65 min (3,933,061 ms) |

---

## 2. Top Endpoints by Request Volume

| Rank | Endpoint | Requests | Errors | Error Rate | Avg Latency (ms) |
|------|----------|----------|--------|------------|-----------------|
| 1 | GET /api/tasks | 64 | 0 | 0% | 0 ms |
| 2 | GET /api/agents | 61 | 0 | 0% | 8 ms |
| 3 | GET /api/cost | 57 | 0 | 0% | 3 ms |
| 4 | GET /api/announcements | 57 | 0 | 0% | 4 ms |
| 5 | GET /api/stats | 56 | 0 | 0% | 1 ms |
| 6 | GET /api/team-channel | 56 | 0 | 0% | 1 ms |
| 7 | GET /api/ceo-inbox | 56 | 0 | 0% | 0 ms |
| 8 | GET /api/mode | 56 | 0 | 0% | 0 ms |
| 9 | GET /api/research | 56 | 0 | 0% | 0 ms |
| 10 | GET /api/knowledge | 56 | 0 | 0% | 0 ms |
| 11 | GET /api/watchdog-log | 55 | 0 | 0% | 0 ms |
| 12 | GET / | 42 | 0 | 0% | 1 ms |

**Observation:** The top endpoints are all polling-style reads — consistent with the dashboard frontend polling on a fixed interval (~1 req/s across all endpoints). The tight clustering around 56–64 requests over ~138 seconds suggests a ~2.5 second polling loop on the dashboard.

---

## 3. Error Analysis

| Endpoint | Requests | Errors | Error Rate | Notes |
|----------|----------|--------|------------|-------|
| PATCH /api/tasks/55 | 3 | 2 | **66.7%** | Task update failures — likely concurrency or task already claimed |
| POST /api/tasks/55/claim | 3 | 2 | **66.7%** | Race condition on task claiming |
| GET /api/agents/nobody_xyz_123 | 1 | 1 | **100%** | Expected — test of unknown agent |
| POST /api/agents/nobody_xyz_123/message | 1 | 1 | **100%** | Expected — test of unknown agent |
| POST /api/agents/charlie/message | 2 | 1 | **50.0%** | Intermittent message delivery failure |
| POST /api/tasks | 13 | 3 | **23.1%** | Task creation failures — validation or duplicate |
| DELETE /api/tasks/55 | 12 | 2 | **16.7%** | Delete on already-deleted or non-existent task |
| GET /api/search | 2 | 1 | **50.0%** | Search failure — likely empty query or invalid params |
| PATCH /api/tasks/999999 | 1 | 1 | **100%** | Expected — test of non-existent task ID |
| DELETE /api/tasks/999999 | 1 | 1 | **100%** | Expected — test of non-existent task ID |

**Root Cause Analysis:**
- The 999999 and `nobody_xyz_123` errors are **expected test cases** (e2e QA validation) — not real failures.
- **PATCH /api/tasks/55 and POST /api/tasks/55/claim at 66.7% error** is the most concerning real issue. The same task is being patched and claimed with high failure rates — consistent with multiple agents racing on the same task ID.
- **POST /api/tasks at 23.1%** warrants investigation — likely duplicate task creation or missing required fields.
- **POST /api/agents/charlie/message at 50%** suggests intermittent write failures to charlie's inbox.

---

## 4. Latency Distribution

| Endpoint | Avg ms | Min ms | Max ms | Assessment |
|----------|--------|--------|--------|------------|
| GET /api/agents | 8 ms | 3 ms | 19 ms | Acceptable — file system reads |
| GET /api/announcements | 4 ms | 1 ms | 22 ms | Watch max spike |
| GET /api/cost | 3 ms | 1 ms | 8 ms | Good |
| GET /api/agents/bob/inbox | 12 ms | 12 ms | 12 ms | Only 1 sample |
| GET /api/metrics/agents | 10 ms | 10 ms | 10 ms | Only 1 sample |
| GET /api/tasks | 0 ms | 0 ms | 1 ms | Excellent |
| All other GETs | 0–1 ms | 0 ms | 6 ms | Excellent |

**Key Finding:** All endpoints are fast (sub-20ms avg). The `GET /api/agents` at 8ms avg and occasional 19ms max is expected — it reads from 20 agent directories. No latency issues requiring immediate action.

---

## 5. Cost & Velocity Analysis

**7-Day Token Spend Summary:**

| Metric | Value |
|--------|-------|
| Total Cost (7d) | **$56.26** |
| Total Cycles (7d) | 1,114 |
| Avg Cost per Cycle | $0.0505 |

**Per-Agent Cost (7-day):**

| Agent | Cost (USD) | Cycles | Avg $/Cycle | Notes |
|-------|-----------|--------|-------------|-------|
| charlie | $7.32 | 118 | $0.062 | Highest total spend |
| bob | $7.26 | 107 | $0.068 | High cost/cycle |
| dave | $7.26 | 59 | $0.123 | **Highest cost/cycle** — investigate |
| sam | $6.01 | 62 | $0.097 | High cost/cycle |
| olivia | $5.94 | 60 | $0.099 | High cost/cycle |
| alice | $4.66 | 268 | $0.017 | Most efficient — most cycles |
| eve | $3.58 | 42 | $0.085 | Moderate |
| tina | $3.38 | 43 | $0.079 | Moderate |
| mia | $3.26 | 43 | $0.076 | Moderate |
| liam | $2.70 | 41 | $0.066 | Moderate |
| quinn | $2.79 | 44 | $0.063 | Moderate |
| pat | $2.10 | 44 | $0.048 | Efficient |
| frank | $0 | 23 | $0 | No billable work yet |
| grace | $0 | 23 | $0 | No billable work yet |
| heidi | $0 | 23 | $0 | No billable work yet |
| ivan | $0 | 23 | $0 | No billable work yet |
| judy | $0 | 23 | $0 | No billable work yet |
| karl | $0 | 23 | $0 | No billable work yet |
| nick | $0 | 23 | $0 | No billable work yet |
| rosa | $0 | 23 | $0 | No billable work yet |

**Observation:** 8 agents (frank, grace, heidi, ivan, judy, karl, nick, rosa) show $0 cost despite 23 cycles each. This is a **data anomaly** — either their cycles are not being tracked, or they ran in the early period when cost tracking was not yet implemented.

---

## 6. Task Board Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 9 |
| Open | 8 (88.9%) |
| In Progress | 1 (11.1%) |
| Done | 0 |
| Completion Rate | **0%** |

**Priority Distribution:**
- Critical: 0
- High: 1 (Task #17 — Security Audit, assigned to heidi)
- Medium: 8
- Low: 0

**Active Task:** Task #47 (Developer CLI — karl) is the only in-progress task.

**Concern:** 0% completion rate across 9 tasks. All open tasks appear to have been assigned but not started. This aligns with the stale heartbeat data — several assigned agents (heidi, frank, grace, etc.) may not have been active until recently.

---

## 7. Recommendations

### P0 — Immediate Action
1. **Investigate PATCH /api/tasks/55 and claim race condition** (66.7% error rate). Add mutex or atomic check-and-set on task claim to prevent double-claiming. The `POST /api/tasks/:id/claim` endpoint exists but isn't preventing concurrent updates on the same task.

### P1 — High Priority
2. **Watchdog the 4 stale-heartbeat agents** (alice, mia, olivia, sam). Despite "running" status, heartbeats are 64–70 minutes old. Use `POST /api/agents/watchdog` to restart stuck agents.
3. **Investigate POST /api/tasks 23.1% failure rate**. Determine if this is validation failures (missing fields), duplicates, or a bug in task creation logic.

### P2 — Performance Attention
4. **Dave's high cost/cycle ($0.123/cycle)** — highest in the team. Review dave's last 5 cycles to determine if he's doing expensive LLM work unnecessarily. Token conservation rules may not be applied.
5. **POST /api/agents/charlie/message 50% failure** — charlie's inbox writes are unreliable. Could be file locking issue or path problem.

### P3 — Monitor
6. **GET /api/agents max latency at 19ms** — acceptable now but will grow as agent count scales. Consider caching agent status with a 5s TTL.
7. **All 20 agents have unread inbox messages** — system-wide inbox backlog. The mass of tina_e2e messages suggests automated e2e tests are flooding inboxes. Consider filtering or archiving e2e test messages separately.

---

## 8. Data Quality Notes

- **Server uptime at analysis was only 2m 18s** — endpoint request counts reflect a fresh server restart, not steady-state traffic. The 56–64 request cluster is the dashboard's polling loop warming up. Latency and error patterns are more reliable than absolute counts.
- **Cost data is 7-day historical** and independent of server uptime — cost figures are reliable.
- **Health score of 100 appears to not factor in stale heartbeats** — the health scoring model should be updated to penalize agents with heartbeats >15 min old.

---

*Report produced by Grace (Data Engineer) — Task #45*
*Output: agents/grace/output/metrics_analytics.md*
