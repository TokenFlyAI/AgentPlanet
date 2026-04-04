# STRATEGIC DIRECTION: Kalshi Arbitrage Trading Pipeline (Wen Zhou)

## Vision
Build a high-frequency arbitrage engine for Kalshi prediction markets using correlation-based pair trading.

## Core Strategy (4-Phase Pipeline)

### Phase 1: Market Filtering (Daily Scan)
- Filter by **volume** — exclude low-liquidity markets (noise)
- Filter by **yes/no ratio** — find mispriced options
  - Target: 15%-30% or 70%-85% YES ratio
  - Rationale: Extreme ratios (0-15%, 85-100%) have distorted pricing; 50-50 has low edge
  - Exclude middle range (40%-60%) — too efficient, no arbitrage

### Phase 2: LLM-Based Clustering (Daily)
- Use LLM embeddings to identify related market clusters
- Goal: Group similar prediction markets (crypto, politics, sports, etc.)
- Find markets with hidden correlations that traditional screening misses
- Example: "Bitcoin will hit $100k by June" + "Ethereum will hit $5k by Dec" + "Crypto dominance >60%" all in same cluster

### Phase 3: Pairwise Correlation Detection (Daily)
- Apply Pearson/distance-based correlation algorithm to find **strongly correlated pairs**
- Reference: https://hudson-and-thames-arbitragelab.readthedocs-hosted.com/en/latest/distance_approach/pearson_approach.html
- Identify markets where price movements are strongly linked
- Example: If BTC market moves up 5%, correlated ETH market *should* move similarly—if it doesn't, that's arbitrage

### Phase 4: Automated Execution (Real-Time, C++)
- High-speed trading engine to **exploit correlation gaps**
- Why C++: Each trade moves prices. We need sub-millisecond execution to capture arbitrage before it's priced out.
- Algorithm: 
  1. Detect gap between correlated markets (e.g., BTC up 5%, ETH up only 2%)
  2. Calculate expected spread using historical correlation
  3. Execute buy/sell pairs to lock in profit
  4. Monitor position until convergence

## Why This Works
- **Phase 1+2 reduce noise** — we ignore 99% of markets, focus on high-edge setups
- **Phase 3 finds real edges** — correlation-based pairs are harder to game than single-market signals
- **Phase 4 captures before reversion** — C++ execution prevents front-running and slippage

## Timeline
- Sprint 8: Build phases 1-3 (market scanner + clustering + correlation detector)
- Sprint 9: Build phase 4 (C++ execution engine + integration)
- Week 10: Paper trade full pipeline, validate win rate >40%
- Week 11: Go live (pending founder approval)

## Team Assignments (for alice to orchestrate)
- Grace: Phase 1 (market filtering logic)
- Ivan: Phase 2 (LLM embedding clustering)
- Bob: Phase 3 (Pearson correlation implementation)
- Dave: Phase 4 (C++ execution engine design + integration)
- Alice: Coordinate, test, validate win rate

Go build this. This is the real edge.
