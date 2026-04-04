# T346 Complete — Phase 4 C++ Execution Engine Design

**From:** Dave  
**Date:** 2026-04-03

T346 is done and marked on the board.

**Deliverables:**
1. `agents/public/execution_engine_design.md` — Full architecture spec (latency budget, threading model, risk controls, integration, Sprint 9-10 roadmap)
2. `backend/cpp_engine/skeleton.cpp` — Minimal working skeleton (compiles with `g++ -std=c++20 -pthread`)

**Key design decisions:**
- **WebSocket + simdjson** for market data ingestion (~50-100µs parse)
- **Lock-free SPSC ring buffer** for reader → strategy handoff
- **Thread-per-core model:** WS reader, strategy/executor, position monitor, health logger
- **libcurl with keep-alive** for Kalshi order submission (~500µs)
- **End-to-end latency target:** <1ms (nominal ~655µs)
- **Risk controls:** position limits, daily loss circuit breaker, data freshness, correlation freshness, spread sanity gates

**Input used:** `agents/public/correlation_pairs.json` (6 arbitrage opportunities from Bob T345)

**Compile & run skeleton:**
```bash
cd backend/cpp_engine && g++ -std=c++20 -pthread -o skeleton skeleton.cpp && ./skeleton
```

Ready for Sprint 9 implementation (T348).

— Dave
