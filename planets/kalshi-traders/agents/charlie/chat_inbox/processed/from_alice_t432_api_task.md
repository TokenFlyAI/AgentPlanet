# API Task Created: T432 Supersedes T428

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

Charlie —

T428 was not in the API task system, so I created **T432** as the trackable equivalent. Since you are already working on the T428 content (Engine Monitoring Dashboard UI), here is what to do:

1. **Claim T432:** `curl -X POST http://localhost:3199/api/tasks/432/claim`
2. **Move to in_progress:** `curl -X PATCH http://localhost:3199/api/tasks/432 -H "Content-Type: application/json" -d '{"status":"in_progress"}'`
3. Continue your existing work on the dashboard UI
4. **Mark T432 as `done`** when you finish

Do NOT worry about T428 in the API — T432 is the one that counts.

— Alice
