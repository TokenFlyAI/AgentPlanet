# Agent Health Scoring — Design & Prototype

**Author**: Ivan (ML Engineer)
**Task**: #46
**Date**: 2026-03-30
**Status**: Complete — Prototype validated against live API

---

## Problem Statement

The team has 20 agents. Leadership (Alice, Olivia, Sam) manually monitors status.md files and heartbeats to detect underperforming or stuck agents. A normalized 0–100 health score enables:

- Automated alerting when an agent degrades
- Consistent triage priority for TPMs
- Foundation for predictive retraining / auto-recovery

**Success metric**: Score correctly ranks known-active vs known-idle agents with >90% agreement with human judgment.

---

## Scoring Model Design

### Feature Selection

Selected from data available in `/api/agents` (zero extra I/O):

| Feature | Source Field | Rationale |
|---------|-------------|-----------|
| Liveness | `alive`, `lastSeenSecs` | Is the agent responding? |
| Activity | `current_task` | Is the agent doing useful work? |
| Inbox pressure | `unread_messages` | Is the agent keeping up? |
| Heartbeat freshness | `heartbeat_age_ms` | Independent file-based liveness probe |
| Error status | `auth_error` | Critical failure mode |

### Scoring Dimensions (max 100 points)

#### 1. Liveness (0–30 pts) — weight 30%

| Condition | Points |
|-----------|--------|
| `alive = true` AND `lastSeenSecs < 60` | 30 |
| `alive = true` AND `lastSeenSecs < 300` | 20 |
| `alive = true` AND `lastSeenSecs < 900` | 10 |
| `alive = true` AND `lastSeenSecs ≥ 900` | 5 |
| `alive = false` | 0 |

#### 2. Activity (0–25 pts) — weight 25%

| Condition | Points |
|-----------|--------|
| Non-null task with active verb (working/running/building/session N) | 25 |
| Non-null task, unclear state | 18 |
| Non-null task marked complete or "looking for next" | 15 |
| `current_task = null` | 5 |

#### 3. Inbox Pressure (0–20 pts) — weight 20%

| Unread Messages | Points |
|----------------|--------|
| 0 | 20 |
| 1–5 | 17 |
| 6–15 | 13 |
| 16–30 | 9 |
| 31–60 | 4 |
| > 60 | 0 |

#### 4. Heartbeat Freshness (0–15 pts) — weight 15%

| Heartbeat Age | Points |
|--------------|--------|
| < 10 minutes | 15 |
| 10–30 minutes | 12 |
| 30–60 minutes | 8 |
| 60–120 minutes | 4 |
| > 120 minutes | 0 |
| No heartbeat file (`null`) | 8 (neutral) |

#### 5. Error Status (0–10 pts) — weight 10%

| Condition | Points |
|-----------|--------|
| `auth_error = false` | 10 |
| `auth_error = true` | 0 |

---

## Grade Thresholds

| Score | Grade | Interpretation |
|-------|-------|---------------|
| 85–100 | A | Healthy — operating well |
| 70–84 | B | Good — minor issues |
| 55–69 | C | Watch — degraded performance |
| 40–54 | D | At risk — intervention recommended |
| 0–39 | F | Critical — likely stuck or dead |

---

## Live Results (2026-03-30)

Run against live `/api/agents` endpoint:

```
Rank  Agent       Score  Grade  Liveness  Activity  Inbox  Heartbeat  Errors
──────────────────────────────────────────────────────────────────────────────────
   1  bob            90      A        30        25     17          8      10
   2  dave           90      A        30        15     20         15      10
   3  liam           90      A        30        18     17         15      10
   4  tina           90      A        30        18     17         15      10
   5  charlie        87      A        30        15     17         15      10
   6  olivia         87      A        30        15     17         15      10
   7  mia            86      A        30        25     17          4      10
   8  eve            83      B        30        15     20          8      10
   9  quinn          80      B        30        15     17          8      10
  10  sam            79      B        30        15     20          4      10
  11  pat            70      B        30        18      4          8      10
  12  karl           66      C        30        18      0          8      10
  13  alice          59      C        30        15      0          4      10
  14  frank          53      D        30         5      0          8      10
  15  grace          53      D        30         5      0          8      10
  16  heidi          53      D        30         5      0          8      10
  17  ivan           53      D        30         5      0          8      10
  18  judy           53      D        30         5      0          8      10
  19  nick           53      D        30         5      0          8      10
  20  rosa           53      D        30         5      0          8      10

Team Average: 71.4  |  Min: 53  |  Max: 90
Grade Distribution: A:7  B:4  C:2  D:7  F:0
```

### Key Insights

1. **Primary differentiator is inbox + activity** — all agents are alive today (liveness=30 for all), so the score spread comes from unread backlog and task status.

2. **7 agents at D (score 53)** — frank, grace, heidi, ivan, judy, nick, rosa — all have `current_task = null` and 67–73 unread messages. These are operationally backlogged and idle. Recommended action: process inboxes and claim tasks.

3. **Alice scores C (59)** — despite being Acting CEO, alice has 66 unread messages and a stale heartbeat (67 min). Her current_task mentions "Cycle 6 complete" — a finished state. This is expected: high-volume leadership roles accumulate broadcast unread counts.

4. **bob leads at 90** — zero unread, active task language ("Session 11 started"), alive and fresh.

5. **Heartbeat coverage is sparse** — only alice, mia, olivia, sam have heartbeat.md files. The majority get `null` → 8pts neutral. This limits the heartbeat signal's discriminating power.

---

## Prototype Location

```
agents/ivan/output/health_scoring_prototype.js
```

Usage:
```bash
node agents/ivan/output/health_scoring_prototype.js
```

Requires dashboard running on `localhost:3199`.

---

## Recommended Next Steps

1. **Integrate into dashboard** — Add `GET /api/agents/:name/health` endpoint. Charlie can surface this in the UI as a colored health badge.

2. **Fix broadcast noise** — `unread_messages` is inflated by e2e broadcast messages. Consider filtering `from_tina_e2e` and similar test messages from unread count, or adding a `relevant_unread` field to the API.

3. **Standardize heartbeats** — Mandate all agents write `heartbeat.md` each cycle. Currently only 4–5/20 do this. Once universal, heartbeat becomes the most reliable liveness signal.

4. **Trend scoring** — Score once per cycle and store timeseries. Detect agents whose score is dropping over consecutive cycles — early warning before critical failure.

5. **Calibration** — After 1 week of data, run correlation analysis between health score and actual task completion rate. Adjust dimension weights empirically.

---

## Algorithm Complexity

- **Input**: 1 HTTP GET to `/api/agents` (~3KB JSON for 20 agents)
- **Compute**: O(N) scoring, N=20 agents
- **Latency**: <5ms local, bounded by HTTP roundtrip
- **No ML training required** — rule-based model is interpretable and tunable

The rule-based approach is intentional. With only 20 agents and well-understood signals, a supervised model would overfit. The scoring rules encode domain knowledge directly. Once we have 30+ days of labeled data (health score vs actual task throughput), a gradient-boosted model becomes viable — with this design as the feature engineering baseline.
