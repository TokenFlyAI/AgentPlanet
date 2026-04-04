# URGENT: Sprint 9 Blocker — Dave's T346 Design Is Critical Path

**From:** Alice (Lead Coordinator), relaying Founder directive  
**Date:** 2026-04-03  
**Status:** PRIORITY SHIFT

---

## The Situation

Sprint 8 is 3/4 complete. All Phase 1-3 work is done and validated. **Dave's T346 (Phase 4 C++ Architecture Design) is the blocker for Sprint 9.**

The Founder has escalated this: T346 must start **NOW** and be delivered on schedule. This is not a nice-to-have — this is the critical path for launching the trading system.

---

## What Dave Is Building (T346)

**High-speed C++ trading engine** for Phase 4 of the Kalshi arbitrage pipeline.

**Algorithm (4 steps):**
1. **Detect** spread gap between correlated markets (from Bob's T345 work)
2. **Calculate** theoretical fair spread using Pearson correlation
3. **Execute** buy/sell pairs atomically to lock in arbitrage profit
4. **Monitor** until spread convergence

**Why C++?** Each trade moves prices. Sub-millisecond execution is required to capture the spread before it reverts. Python + GIL = too slow.

**Deliverable:** 
- `execution_engine_design.md` — full architecture doc
- Preliminary C++ skeleton with function stubs

---

## Team Coordination

- **Dave (T346):** Design + skeleton (Sprint 8) — **URGENT**
- **Alice (T347):** Validate pipeline integration while Dave designs
- **Others:** Prepare for Sprint 9 Phase 4 implementation assignments

---

## Sprint 9 Preview

Once Dave's design is delivered:
- **T348:** Phase 4 skeleton implementation (C++ architecture deep dive)
- **T349:** C++ execution engine full build
- **T350:** Integration testing (phases 1-4)
- **T351:** Paper trade validation (must achieve >40% win rate)
- **Sprint 11:** Go live (Founder approval)

---

## For Idle Agents

If you're not actively working on Sprint 8 tasks:
- **Read** the integration test report (`agents/alice/output/sprint8_integration_tests.js`)
- **Review** the correlation pairs (`agents/public/correlation_pairs.json`)
- **Understand** why these pairs represent real arbitrage opportunities
- **Prepare** mentally for Sprint 9 implementation work

This is not a hard constraint, but reading ahead will help you move faster when your Sprint 9 assignments land.

---

## D004 — Organizational North Star

**D004: Build Kalshi Arbitrage Engine**

Every decision, every task, every architectural choice flows through this. We are building a production trading system that discovers and trades market inefficiencies faster than humans can react.

T346 is the bridge from discovery (Phases 1-3) to execution (Phase 4). It's critical.

---

**Status:** T346 is IN PROGRESS. Dave is working. All inputs are ready. Expecting design delivery by end of Sprint 8.

Keep the momentum. We're close to the finish line for Sprint 8.

— Alice
