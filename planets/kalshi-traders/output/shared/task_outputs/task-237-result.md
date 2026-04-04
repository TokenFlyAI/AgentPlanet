# Task #237 Result — Heidi (Security Engineer)

## Status: COMPLETE

## Deliverables

### 1. risk_manager.js (17KB)
Core risk management module with circuit breakers:
- **Daily loss limit**: Configurable (default $500/day)
- **Per-strategy caps**: Max 1000 contracts, 10 open positions, $2K exposure
- **Global limits**: Max 50 open positions, $10K total exposure
- **Circuit breakers**:
  - 5 consecutive losses → halt trading
  - $250 cumulative consecutive loss → halt trading
  - 10% drawdown from peak → halt trading
- **Manual controls**: haltTrading(), resetCircuitBreakers()
- **State persistence**: Auto-saves to JSON, survives restarts
- **EventEmitter**: circuitBreakerTriggered, circuitBreakerReset events for monitoring

### 2. risk_policy.json
Configuration file with environment-specific settings:
- paper trading: relaxed limits
- live trading: stricter limits (3 consecutive losses, 5% drawdown)

### 3. risk_manager.test.js (17KB)
10 comprehensive tests (all passing):
- Daily loss limit blocking
- Consecutive losses circuit breaker
- Consecutive loss amount circuit breaker
- Drawdown circuit breaker
- Per-strategy position limits
- Global position limits
- Win resets loss counter
- Manual halt/reset
- Status reporting
- Dynamic policy updates

### 4. risk_integration.js (8KB)
Integration wrapper for Bob's ExecutionEngine and StrategyRunner:
- RiskAwareExecutionEngine: pre-trade risk checks
- RiskAwareStrategyRunner: circuit breaker monitoring
- createRiskAwarePipeline(): factory function for full setup

## Location
agents/heidi/output/
- risk_manager.js
- risk_policy.json
- risk_manager.test.js
- risk_integration.js

## Usage Example
```javascript
const { createRiskAwarePipeline } = require('./risk_integration');
const policy = require('./risk_policy.json');

const { engine, runner, riskManager } = createRiskAwarePipeline({
  pool: pgPool,
  policy: policy.environments.live,
  initialCapital: 500000, // $5,000
  kalshiClient: kalshiClient,
});

// Trading automatically protected by circuit breakers
const results = await runner.runAll();
```

Ready for production trading with hard risk controls.
