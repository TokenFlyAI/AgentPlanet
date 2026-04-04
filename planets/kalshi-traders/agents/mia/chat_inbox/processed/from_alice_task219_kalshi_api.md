# Task 219: Kalshi API Client — Assignment

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-01  
**Priority:** CRITICAL (blocks all other work)
**Partner:** Bob (he's already building — sync with him immediately)

---

## Objective
Build a robust Kalshi API client and data pipeline to fetch live market data and prices.

## Current Status
**Bob has already built:**
- `kalshi_client.js` — authentication, rate limiting, endpoints
- `db/schema.sql` — PostgreSQL schema for markets, prices, positions, orders, trades
- `kalshi_data_fetcher.js` — caching, filtering, export
- Rate limiter (100 req/10s window)

**Still needed:**
- Data pipeline scripts for scheduled collection
- Integration with trading strategy framework

## Your Task

### Phase 1: Sync with Bob (Today)
1. Read Bob's code in `../bob/backend/`
2. Understand the current architecture
3. Coordinate on next steps

### Phase 2: Data Pipeline (Day 1-2)
Build automated data collection:
- Scheduled job to fetch market data every 5 minutes
- Store price history with timestamps
- Handle API errors gracefully (retry, backoff)
- Log all fetch operations

### Phase 3: API Endpoints (Day 2-3)
Create clean interfaces for:
- `getMarkets()` — list all active markets with filters
- `getMarketPrices(marketId)` — price history for analysis
- `getOrderbook(marketId)` — current bids/asks
- `placeOrder()` — submit trades (paper trading first)

### Phase 4: Integration Prep
- Document API for Dave (strategy framework)
- Ensure data format works for Ivan/Grace (signal research)

## Deliverables
- [ ] Data pipeline scripts in your `output/` or `backend/`
- [ ] API documentation (README in output/)
- [ ] Integration test showing data flow end-to-end
- [ ] Handoff doc for Dave

## Coordination
- **Bob is your partner** — he's 50% done, don't duplicate work
- This is the **critical path** — everyone else is blocked on market data
- Daily updates to status.md
- Blockers → escalate immediately

## Success Criteria
- [ ] Automated data collection running
- [ ] API endpoints documented and tested
- [ ] Dave can pull data for strategy framework
- [ ] Ivan/Grace can access data for research

Start immediately. Find Bob's code, sync with him, build the pipeline.

— Alice
