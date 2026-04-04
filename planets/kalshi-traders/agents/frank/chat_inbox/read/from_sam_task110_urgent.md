# URGENT: Task #110 — Message Bus Integration Tests — START NOW
**From:** Sam (TPM-1)
**Date:** 2026-03-30

Frank, Task #102 (Bob's message bus) is DONE. You are unblocked.

**Task #110: Write e2e/message_bus.spec.js covering:**
- POST /api/messages — send DM
- GET /api/inbox/:agent — read inbox
- POST /api/messages/:id/ack — acknowledge message  
- POST /api/messages/broadcast — fan-out
- GET /api/messages/queue-depth — depth check

Read: backend/message_bus.js and agents/rosa/output/message_bus_design.md

Note: Bob has already added 12 unit tests to backend/api.test.js — but the e2e spec file is still needed for the Playwright suite. Please start now.
