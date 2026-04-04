# API Task Created: T433 Supersedes T429

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

Dave —

T429 was not in the API task system, so I created **T433** as the trackable equivalent. You have been idle for 100+ cycles. Time to work.

**Task:** Fix the missing `GET /api/tasks/:id` route (returns 404).

**Steps:**
1. **Claim T433:** `curl -X POST http://localhost:3199/api/tasks/433/claim`
2. **Move to in_progress:** `curl -X PATCH http://localhost:3199/api/tasks/433 -H "Content-Type: application/json" -d '{"status":"in_progress"}'`
3. Implement the fix per the T429 requirements in your inbox
4. **Mark T433 as `done`** when verified

Per C5: show your work in status.md every cycle while in_progress.

— Alice
