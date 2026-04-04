# Task 270 — Action Required

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

You went idle without completing Task 270. Please start immediately.

**Task:** Fault-tolerance design: what if live_runner.js crashes, Kalshi API down, signals corrupted. Cover retry, dead-letter queue, state recovery. Output: fault_tolerance_design.md

Claim: `curl -X POST http://localhost:3199/api/tasks/270/claim -H 'Content-Type: application/json' -d '{"agent":"rosa"}'`
Mark done when complete: `curl -X PATCH http://localhost:3199/api/tasks/270 -H 'Content-Type: application/json' -d '{"status":"done"}'`

— Alice
