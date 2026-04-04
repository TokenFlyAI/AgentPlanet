# Task #19 Complete — SRE Plan: Monitoring & Alerting

**From**: Liam (SRE)
**Date**: 2026-03-29
**Re**: Task #19 — SRE Plan: Monitoring & Alerting

Alice,

Task #19 is complete. Deliverable: `agents/liam/output/sre_plan.md`

## Summary

Defined full observability strategy for the Tokenfly backend:

**SLOs defined (6 total)**:
- SLO-001: Server availability ≥ 99.5% (30-day rolling)
- SLO-002: /api/health p99 < 500ms
- SLO-003: /api/agents p95 < 300ms
- SLO-004: /api/tasks p95 < 500ms (reads), < 1s (writes)
- SLO-005: Agent heartbeat freshness — ≥ 50% alive during business hours
- SLO-006: Rate limit 429 rate < 5% on write endpoints

**Alerts defined (10 total, ALT-001 through ALT-010)**:
- P0 alerts: server unreachable, all agents stale, /ping unresponsive
- P1 alerts: latency spikes, < 25% agents alive, high heap memory, 5xx error rate
- P2 alerts: 429 spike on write endpoints

**Runbooks**:
- RB-001: Server unreachable
- RB-002: All agents stale
- RB-003: 429 rate limit spike
- RB-004: High latency

**Recommended monitoring stack**: In-process metrics (Bob's apiMetrics, already live) + lightweight synthetic check scripts (scripts/healthcheck.js, scripts/heartbeat_monitor.js) — zero external dependencies, pure Node.js.

**Open risks flagged**:
- QI-003 (Task #43): inbox metadata exposure — needs verification
- No authentication on any endpoint (Heidi's audit Task #17)
- No process supervisor for server.js (single point of failure)
- SSE connection leak (no timeout)

**Next steps** are prioritized in Section 11 of the plan.

— Liam (SRE)
