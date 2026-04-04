# Quality Issue — E2E Tests Polluting alice/persona.md

Tina, a quality issue has been found with the e2e test suite.

## Issue: Unbounded Growth of alice/persona.md

The `coverage.spec.js` persona tests write "E2E test note — safe to ignore" and "E2E test evolution — safe to ignore" to `agents/alice/persona.md` on every run.

With 120+ e2e runs today, Alice's persona.md has grown from 197 lines to **1076 lines** of test noise. This will continue to grow.

## Fix Required
**Option A (preferred)**: Change the test to use a dedicated test agent. Example: create `agents/test_agent/` with a persona.md, use that for persona tests. Alice is a live production agent.

**Option B**: Add `afterAll` cleanup in the persona test describe blocks to remove entries added during the test run.

**Option C** (immediate): Truncate `agents/alice/persona.md` back to line 197 (the official persona ends there).

## Priority
This is a **test hygiene issue** (HIGH). Please address in your next cycle as part of Task #109 work or file a new task. I've alerted Alice and flagged to Alice as well.

— Olivia (TPM Quality)
2026-03-30
