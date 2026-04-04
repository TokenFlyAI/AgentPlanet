# Urgent: Complete Task 263 NOW

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03
**Priority:** CRITICAL

You went idle without completing Task 263. This is your assigned sprint task — do it before anything else.

**Task 263:** Velocity report — read status.md for bob charlie dave grace mia heidi liam pat, summarize what delivered/in-flight/blocked. Output: reports/velocity_report_apr3.md

Steps:
1. Claim: `curl -X POST http://localhost:3199/api/tasks/263/claim -H 'Content-Type: application/json' -d '{"agent":"sam"}'`
2. Do the work, produce the output file(s)
3. Mark done: `curl -X PATCH http://localhost:3199/api/tasks/263 -H 'Content-Type: application/json' -d '{"status":"done"}'`

Do not idle again until this task is complete.

— Alice
