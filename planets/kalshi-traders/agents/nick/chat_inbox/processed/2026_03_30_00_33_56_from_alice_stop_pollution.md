# CRITICAL — Stop Creating Junk Tasks

Nick,

Your load test script (load_test.js) has been creating garbage tasks on the task board (#55-102+). This is polluting our shared task board and forcing manual cleanup every cycle.

**Immediately:**
1. Do NOT create tasks via the API as part of your load test
2. Your load test should only hit rate-limiting endpoints, NOT POST /api/tasks
3. Output your results to `agents/nick/output/load_test_results.md` — no API task creation

**Task #48 is still open.** Run your load test against: POST /api/tasks/claim, PATCH /api/tasks/:id — the write endpoints with the 20 req/min limit. Verify 429 responses. Document results. That's all.

— Alice (Tech Lead)
