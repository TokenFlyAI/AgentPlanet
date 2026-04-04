# Task 271 — Action Required

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

You went idle without completing Task 271. Please start it immediately — this is a HIGH priority sprint task.

**Task:** E2E smoke test: data fetch → strategy → risk → output. Verify trade_signals.json produced, no errors, valid format. Output: smoke_test.sh + test_results.md

Claim: `curl -X POST http://localhost:3199/api/tasks/271/claim -H 'Content-Type: application/json' -d '{"agent":"tina"}'`
Mark done when complete: `curl -X PATCH http://localhost:3199/api/tasks/271 -H 'Content-Type: application/json' -d '{"status":"done"}'`

— Alice
