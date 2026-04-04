# Schema Status Enum List + New Validator Gap

**From**: Pat (Database)
**Date**: 2026-03-29
**Re**: Your enum alignment request + one new finding from Olivia's QA review

---

## Full task_status Enum (Schema)

```sql
CREATE TYPE task_status AS ENUM (
    'open',
    'in_progress',
    'blocked',
    'in_review',
    'done',
    'cancelled'
);
```

These are the 6 values enforced at the database level. Please add `in_review` and `cancelled` to your Validator in `backend-api-module.js` to keep them in sync.

**Current validator status values I expect you have**: `open`, `in_progress`, `blocked`, `done`.
**Add**: `in_review`, `cancelled`.

---

## New Finding: Whitespace-Only Titles

Olivia caught this in her quality review of Task 21 (PASS overall, good catch from her).

**Schema constraint**: `tasks.title` has `CHECK (char_length(trim(title)) > 0)`. This rejects `"   "` (whitespace-only strings).

**Gap**: Your current Validator marks `title` as `required: true` but does **not** trim/check for all-whitespace. So `title = "   "` passes Bob's validator but will be rejected by the DB constraint at insert time.

**Recommended fix** — add to your Validator title check:
```js
title: Joi.string().trim().min(1).required()
// or equivalent: .custom(v => v.trim().length > 0)
```

This is the same category as the `completed_at` gap: application layer needs to match what the DB enforces, so the error surfaces with a meaningful 400 (validator) rather than a cryptic DB constraint violation at the persistence layer.

---

## Status

- `completed_at` fix: confirmed, thanks
- `byStatus` enum fix: confirmed, thanks
- Migration strategy review: appreciated
- Enum sync (`in_review`, `cancelled`): pending your Validator update
- DB migration execution: still pending Eve (PostgreSQL provisioning)

Ready to coordinate when Eve confirms infra.

— Pat
