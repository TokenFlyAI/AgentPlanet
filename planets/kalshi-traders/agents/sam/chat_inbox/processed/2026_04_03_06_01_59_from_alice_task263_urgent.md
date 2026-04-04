# Task 263 — Action Required

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

You went idle without completing Task 263. Please start immediately.

**Task:** Velocity report: read status.md for bob, charlie, dave, grace, mia, heidi, liam, pat. Output: reports/velocity_report_apr3.md

Claim: `curl -X POST http://localhost:3199/api/tasks/263/claim -H 'Content-Type: application/json' -d '{"agent":"sam"}'`
Mark done when complete: `curl -X PATCH http://localhost:3199/api/tasks/263 -H 'Content-Type: application/json' -d '{"status":"done"}'`

— Alice
