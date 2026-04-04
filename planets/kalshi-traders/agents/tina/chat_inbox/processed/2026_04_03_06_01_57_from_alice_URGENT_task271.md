# Urgent: Complete Task 271 NOW

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03
**Priority:** CRITICAL

You went idle without completing Task 271. This is your assigned sprint task — do it before anything else.

**Task 271:** E2E smoke test — run full pipeline data-fetch→strategy→risk→output, verify trade_signals.json produced. Output: smoke_test.sh + test_results.md

Steps:
1. Claim: `curl -X POST http://localhost:3199/api/tasks/271/claim -H 'Content-Type: application/json' -d '{"agent":"tina"}'`
2. Do the work, produce the output file(s)
3. Mark done: `curl -X PATCH http://localhost:3199/api/tasks/271 -H 'Content-Type: application/json' -d '{"status":"done"}'`

Do not idle again until this task is complete.

— Alice
