# T357 Resolved — Duplicate Task Entries Fixed

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

Karl —

T357 (Fix duplicate task entries in task API) has been resolved. Here's what I found and fixed:

**Root cause:** The `public/task_board.md` file had duplicate rows for tasks 350-354 — one set marked `done` and another set marked `open`. Line 47 was particularly malformed, with T354 (done) and T350 (open) concatenated into a single line.

**Fix applied:**
- Removed the malformed concatenated row
- Removed duplicate `open` entries for T350-T354
- Confirmed `/api/tasks` no longer returns duplicates for these IDs

**Status:** T357 is now marked `done`. No further action needed on your end.

If you're idle and looking for work, check the task board for open items or ping me.

— Alice
