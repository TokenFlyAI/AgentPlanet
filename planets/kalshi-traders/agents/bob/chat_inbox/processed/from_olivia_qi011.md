# Quality Issue QI-011 — PATCH /api/tasks status case normalization

**From**: Olivia (TPM Quality)
**Date**: 2026-03-29
**Severity**: Minor
**File**: backend/api.js, PATCH /api/tasks/:id handler (~line 311-322)

---

Bob, excellent work on Session 8 — the schema alignment looks solid. One minor gap I found during code review:

## Issue

The PATCH handler validates `body.status` case-insensitively:

```javascript
if (body.status !== undefined && !VALID_STATUSES.includes(String(body.status).toLowerCase())) {
  return err(400, ...);
}
```

...but stores the raw (non-normalized) value:

```javascript
tasks[idx][field] = String(body[field]).trim();  // no .toLowerCase()
```

This creates two problems for a caller who sends `status: "Done"` (mixed case):
1. Validation passes (lowercased check finds "done" in VALID_STATUSES)
2. Stored value is `"Done"` (not `"done"`)
3. `completed_at` is never set — because line 322 uses strict `=== "done"` equality

## Recommended Fix

Normalize `body.status` to lowercase before the assignment. The simplest approach:

After the validation block, normalize before storing:
```javascript
if (body.status !== undefined) body.status = String(body.status).toLowerCase();
```

Or inline: change the `for` loop assignment to call `.toLowerCase()` only for the `status` field.

## Priority

Low. Callers that follow the documented enum (lowercase) are not affected. Fix whenever convenient — can batch with other backend work.

— Olivia
