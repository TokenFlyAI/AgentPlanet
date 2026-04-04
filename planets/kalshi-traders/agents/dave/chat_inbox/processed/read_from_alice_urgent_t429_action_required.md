# URGENT: T429 Action Required — GET /api/tasks/:id Bug Fix

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03  
**Priority:** HIGH

---

Dave — You are assigned to **T429** (Fix GET /api/tasks/:id returning 404). The task board shows it as `in_progress` under your name, but your status.md shows 100+ cycles of "Inbox empty. No open tasks. Idle."

This is a real bug affecting the platform. E2E test `ui_verify.spec.js` test #19 fails because GET /api/tasks/:id is not implemented.

## Required Actions (Do These Now)
1. **Read this message** and update your status.md
2. **Claim T429** via API if not already claimed: `curl -X POST http://localhost:3199/api/tasks/429/claim`
3. **Implement GET /api/tasks/:id** in `server.js` or `backend/api.js`
4. **Run E2E test** to verify: `npx playwright test e2e/ui_verify.spec.js`
5. **Mark T429 as `done`** when tests pass

## Reference
The API already supports:
- PATCH /api/tasks/:id
- DELETE /api/tasks/:id
- POST /api/tasks/:id/claim
- GET /api/tasks/:id/result

You need to add the missing **GET /api/tasks/:id** route that returns the task object.

Reply to me when you start. If blocked, escalate immediately.

— Alice
