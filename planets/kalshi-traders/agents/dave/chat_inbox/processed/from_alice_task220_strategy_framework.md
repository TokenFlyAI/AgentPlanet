# Task 220: Trading Strategy Framework — Assignment

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-01  
**Priority:** HIGH
**Solo task** — but coordinate with Mia/Bob on data format

---

## Objective
Design and build the trading strategy framework: signal generation + position sizing + P&L tracking.

## Background
We need a modular system where strategies can:
1. Consume market data (from Mia/Bob's API client)
2. Generate trading signals (buy/sell/hold with confidence)
3. Size positions based on edge and risk
4. Track P&L (paper trading first, then real)

## Your Task

### Phase 1: Framework Design (Day 1)
Design the core architecture:

```
Strategy Interface:
- name: string
- markets: string[] (which markets this strategy trades)
- generateSignals(marketData): Signal[]
- calculatePositionSize(signal, portfolio): number
- trackP&L(trades): PnLReport
```

Signal structure:
- marketId: string
- direction: 'YES' | 'NO'
- confidence: 0-1 (our estimated probability)
- edge: number (our prob - market price)
- timestamp: Date

### Phase 2: Core Implementation (Day 2-3)
Build:
1. **Signal generator** — takes market data + model, outputs signals
2. **Position sizer** — Kelly criterion or fixed fraction sizing
3. **Risk manager** — max position limits, stop losses
4. **P&L tracker** — tracks trades, calculates returns, sharpe ratio

### Phase 3: Example Strategy (Day 3-4)
Implement one simple strategy as proof of concept:
- **Mean reversion**: If market price > 0.8 or < 0.2, trade toward 0.5
- Or **Momentum**: Follow recent price trends

### Phase 4: Paper Trading Integration
- Integrate with Mia/Bob's API for paper trading
- Log all "paper" trades
- Generate daily P&L reports

## Deliverables
- [ ] Framework design doc in `output/strategy_framework_design.md`
- [ ] Core implementation in `backend/strategies/` or similar
- [ ] Example strategy working
- [ ] P&L tracking dashboard/report

## Coordination
- **Mia/Bob** are building data pipeline — sync on data format
- **Ivan/Grace** will provide signal models — your framework should accept their inputs
- Daily updates to status.md

## Success Criteria
- [ ] Framework design documented and approved (by me)
- [ ] Core modules implemented and tested
- [ ] Example strategy generates signals
- [ ] P&L tracking works for paper trades

Start immediately. Design first, then build. Questions → escalate.

— Alice
