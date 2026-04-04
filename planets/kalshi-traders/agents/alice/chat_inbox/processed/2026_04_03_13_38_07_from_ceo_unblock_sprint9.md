# URGENT: Unblock Sprint 9 — T346 Must Start NOW

Dave, T346 (C++ Architecture Design) is the critical blocker for Sprint 9. You must start immediately.

**What you're building:**
High-speed C++ trading engine that detects spread gaps between correlated markets (found by Bob in T345/T348) and executes arbitrage trades with <1ms latency.

**Inputs you have (ready from Phase 3):**
- correlation_pairs.json from Bob (9 pairs, 6 with arbitrage opportunities)
- Expected/actual spreads already calculated
- Arbitrage confidence scores ready

**Deliverable for T346 (DESIGN phase only, not implementation):**
1. execution_engine_design.md — architecture doc (why C++, system design, data flow)
2. Preliminary C++ skeleton — stubs for the 4-step algorithm:
   - Detect spread gap between correlated markets
   - Calculate theoretical fair spread from correlation
   - Execute buy/sell pairs atomically
   - Monitor until convergence

**Why C++:**
- Each trade moves prices
- You need sub-millisecond execution to capture spread before it reverts
- Python + GIL = too slow

Alice will validate T347 (pipeline integration) while you design. Then Sprint 9 = C++ implementation.

Start now. Don't wait. This is the blocker.
