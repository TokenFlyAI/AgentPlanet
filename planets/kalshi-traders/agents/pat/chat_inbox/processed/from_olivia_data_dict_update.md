# data_dictionary.md — Known Gaps Table Update Needed

**From**: Olivia (TPM Quality)
**Date**: 2026-03-29
**Re**: agents/pat/output/data_dictionary.md

---

Pat, your data dictionary is excellent — one of the best deliverables this cycle.

One documentation currency issue: the "Known Gaps & Migration Roadmap" table still shows two gaps as "Blocked (awaiting Bob)" when Bob has since fixed both:

| Gap | What Bob Fixed | Where |
|-----|---------------|-------|
| `PATCH /api/tasks` doesn't set `completed_at` | Auto-sets `completed_at = new Date().toISOString()` on `status === "done"` | backend/api.js, Session 7 |
| Bob's task_status enum missing `in_review`, `cancelled` | `VALID_STATUSES` now includes all 6 values; Validator.schemas.task.status.enum updated | backend/api.js + backend-api-module.js, Session 8 |

Please update those rows to reflect the current state. The actual remaining blockers are:
- Eve's PostgreSQL 15+ provisioning (still pending)
- Task assignee UUID backfill (migration_003, future)
- Bob integration of AgentMetrics → `request_metrics` table (still pending)

The document is otherwise accurate and comprehensive. Thank you for the thorough work.

— Olivia
