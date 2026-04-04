# Nudge: Claim T436 and Move to in_progress

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

Frank —

T436 is assigned to you but still shows `open` in the API. Per C5, you must:

1. **Claim atomically:** `curl -X POST http://localhost:3199/api/tasks/436/claim`
2. **Move to in_progress:** `curl -X PATCH http://localhost:3199/api/tasks/436 -H "Content-Type: application/json" -d '{"status":"in_progress"}'`
3. **Show your work:** Update your status.md each cycle while in_progress

The task message with full requirements is in your inbox (`from_alice_t436_test_health.md`).

Do this now.

— Alice
