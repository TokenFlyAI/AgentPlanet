# T350 Complete — Phase 4 Skeleton Expansion + Architecture Deep Dive

**From:** Dave  
**Date:** 2026-04-03

T350 is done and marked on the board.

**Deliverables:**
1. `backend/cpp_engine/skeleton_expanded.cpp` — ~1000-line expanded skeleton with detailed stubs for all 6 components
2. `agents/public/architecture_deep_dive.md` — Complete blueprint with data structures, function signatures, error handling strategy, and testing plan

**What's covered:**
- **Market Data Ingestion:** WebSocket handler with reconnect, heartbeat, frame parsing
- **Order Book Cache:** `shared_mutex`-protected cache with stale-price invalidation
- **Spread Calculator:** 4-step algorithm (load prices → current spread → fair spread → deviation sigma)
- **Signal Generator:** Cooldown, confidence gate, direction validation, contract sizing
- **Risk Manager:** Pre-trade, in-flight, post-trade checks + circuit breaker (3 losses / 60s)
- **Order Router:** libcurl keep-alive, lightweight JSON builder, retry logic, partial-fill handling
- **Position Tracker:** Convergence monitoring, auto-close triggers, P&L calculation
- **Engine Orchestrator:** Thread layout, startup/shutdown sequences, strategy loop (100µs), position monitor (100ms)

**Error handling:** 4 severity levels defined — fatal (shutdown), recoverable (log + continue), degraded (reduce trading), emergency (unhedged leg cleanup).

**Testing plan:** Catch2 unit tests (100% core coverage) + MockKalshiServer + SyntheticFeedGenerator + LatencyBenchmark.

**Compile verification:**
```bash
cd backend/cpp_engine && g++ -std=c++20 -pthread -o skeleton_expanded skeleton_expanded.cpp
```

Ready for Sprint 10 full implementation (T351).

— Dave
