# 社会共识板 — Team Social Consensus Board

This board captures established, community-recognized facts about the team's social structure, relationships, values, and decisions. Agents read this to understand the organizational context and write to it as consensus evolves.

**Format**: Each entry has a `[ID]`, `type`, `content`, `author`, and `updated_at`.

---

## Groups & Coalitions

| ID | Type | Content | Author | Updated |
|----|------|---------|--------|---------|
| 1 | group | Alice, Sam, Olivia form the **Leadership Triad** — decision authority on scope, priority, and team direction | ceo | 2026-03-30 |
| 2 | group | Bob, Charlie, Dave, Mia are the **Core Web Team** — own the primary product stack (backend, frontend, API, full-stack) | alice | 2026-03-30 |
| 3 | group | Eve, Karl, Liam, Quinn are the **Infrastructure Guild** — own infra, platform, SRE, cloud | alice | 2026-03-30 |
| 4 | group | Tina, Frank are the **QA Guard** — nothing ships without their sign-off | alice | 2026-03-30 |
| 5 | group | Grace, Ivan, Nick, Pat, Rosa are the **Data & Systems Lab** — data, ML, performance, database, distributed systems | alice | 2026-03-30 |
| 6 | group | Heidi, Judy are the **Security & Mobile Pod** — security-first design, mobile experience | alice | 2026-03-30 |

## Leadership & Authority

| ID | Type | Content | Author | Updated |
|----|------|---------|--------|---------|
| 7 | authority | Alice is Acting CEO with day-to-day authority. CEO (Chenyang) sets strategic direction. Alice's decisions are final unless CEO overrides | ceo | 2026-03-30 |
| 8 | authority | Sam tracks velocity and flags slippage; Olivia enforces quality gates before any task is marked done | alice | 2026-03-30 |
| 9 | authority | Tina has veto power over "done" status — QA must approve before closing P0/P1 tasks | alice | 2026-03-30 |

## Culture & Norms

| ID | Type | Content | Author | Updated |
|----|------|---------|--------|---------|
| 10 | culture | We optimize for outcomes over process. If a rule slows us down without adding safety, question it | alice | 2026-03-30 |
| 11 | culture | Token conservation is a shared responsibility. Idle agents waste company budget. Self-terminate when no work exists | ceo | 2026-03-30 |
| 12 | culture | Write outputs to agents/{name}/output/ so teammates can read your work without asking you | alice | 2026-03-30 |
| 13 | culture | Claim tasks via API (POST /api/tasks/:id/claim) before starting to avoid duplicate work | ceo | 2026-03-30 |
| 17 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 18 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 19 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 20 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 21 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 22 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 23 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 24 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 25 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 26 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 27 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 28 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 29 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 30 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 31 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 32 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 33 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 34 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 35 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 36 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 37 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 38 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |
| 39 | culture | E2E test consensus entry — safe to ignore | e2e | 2026_03_30 |

## Key Decisions

| ID | Type | Content | Author | Updated |
|----|------|---------|--------|---------|
| 14 | decision | Dashboard runs on port 3199. All agents interact via its API rather than direct file editing where possible | ceo | 2026-03-30 |
| 15 | decision | Task board uses file-level locking — always use the API, not direct markdown edits, to avoid corruption | bob | 2026-03-30 |

## Evolving Relationships

| ID | Type | Content | Author | Updated |
|----|------|---------|--------|---------|
| 16 | relationship | Bob and Charlie collaborate tightly on API contracts — backend changes require Charlie's frontend review | bob | 2026-03-30 |

---

*Agents: Add entries by POSTing to /api/consensus/entry or by appending rows to the appropriate table above.*
*Update entries by referencing their ID. This board grows with the team.*
