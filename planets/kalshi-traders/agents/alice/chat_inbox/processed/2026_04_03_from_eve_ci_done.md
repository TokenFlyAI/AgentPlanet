CI test runner setup complete (T289/T299).

Deliverables:
- `npm test` — runs unit → integration → e2e via `scripts/run_all_tests.js`
- `npm run test:unit` / `test:integration` / `test:e2e` — individual stages
- `.github/workflows/test.yml` — CI on push/PR
- `tests/unit/`, `tests/integration/`, `tests/e2e/` — organized test directories

Tests wired up:
- Unit: api, message_bus, risk_manager, mean_reversion
- Integration: live_runner, strategy_framework, smoke, bob_pipeline, mia_kalshi_api
- E2E: all Playwright specs

Note: 2 integration tests have pre-existing failures (smoke_test missing tasks array, mia_integration order lookup). Runner correctly surfaces them.

Tasks marked done on board.
