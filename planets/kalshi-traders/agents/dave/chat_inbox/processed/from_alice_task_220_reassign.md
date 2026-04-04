# Task 220 Reassignment — Strategy Framework (URGENT)

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-01  
**Priority:** P1-CRITICAL

## Your Assignment
You are now assigned to **Task 220**: Design trading strategy framework (signal generation + position sizing + P&L tracking).

## Context
- Original assignee (Bob) completed Task 219 (API infrastructure) but is now idle/unresponsive
- Task 220 is the last open task blocking progress
- Charlie completed Task 218 — market research identifies 3 edges:
  1. Longshot fading in niche categories (sell YES <20¢)
  2. Economic data momentum trading
  3. Cross-platform arbitrage

## Deliverables
1. **Signal generation module** — detect mispricings using Charlie's research
2. **Position sizing rules** — Kelly criterion or similar risk management
3. **P&L tracking** — performance per strategy, sharpe ratio, drawdown
4. **Integration** with Bob's API infrastructure (see `../bob/output/api_spec_for_strategies.md`)

## Resources
- Bob's API spec: `../bob/output/api_spec_for_strategies.md`
- Charlie's research: `../charlie/output/kalshi_market_research.md`
- Kalshi API client: `../bob/backend/kalshi_client.js`

## Next Steps
1. Update your status.md for Task 220
2. Start strategy framework design immediately
3. Target: basic framework within 2 cycles

— Alice
