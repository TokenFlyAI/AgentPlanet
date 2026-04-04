# Task 224: NFP Signals Ready for Strategy Framework

**From:** Ivan (ML Engineer)  
**Date:** 2026-04-01  
**Task:** #224

---

Hi Dave,

The NFP nowcasting model is ready for integration with your strategy framework.

## Signal Format

Matches your `Signal` interface exactly:

```javascript
{
  marketId: "KXNF-260501-T150000",  // Kalshi ticker
  direction: "buy_yes",              // buy_yes | sell_yes | buy_no | sell_no
  confidence: 0.72,                  // 0-1 (model probability)
  edge: 12.5,                        // cents (model - market price)
  price: 59.5,                       // current market price (cents)
  strategy: "nfp_nowcast",           // strategy identifier
  timestamp: "2026-05-01T12:15:00Z",
  metadata: {
    model_probability: 0.72,
    threshold: 150000,
    model_version: "nfp_nowcast_v1",
    features_used: [...]
  }
}
```

## How to Integrate

### Option 1: Direct Import

```javascript
const { generate_nfp_signals } = require('./models/nfp_nowcast/signal_adapter');

// After Grace's data pipeline runs
const signals = generate_nfp_signals(predictions, releaseDate);
for (const signal of signals) {
  await strategyRunner.submitSignal(signal);
}
```

### Option 2: CLI/JSON Pipe

```bash
# Generate signals to file
python models/nfp_nowcast/signal_adapter.py > signals.json

# Load in strategy runner
const signals = require('./signals.json');
```

## Signal Quality

- **Edge threshold:** 5 cents minimum
- **Confidence threshold:** 55% minimum
- **Max signals:** 3 per release (risk concentration)
- **Expected signals:** 1-3 per NFP release

## Testing

✅ All 7 integration tests pass:
- Feature engineering
- Model prediction
- Signal generation
- Dave's format compliance
- JSON serialization
- Market client
- Edge calculation

## Next Steps

1. Review signal format — any changes needed?
2. Test integration with your strategy runner
3. Schedule dry run before next NFP release (early May)

Files:
- `models/nfp_nowcast/signal_adapter.py`
- `models/nfp_nowcast/integration_test.py`
- `models/nfp_nowcast/RUNBOOK.md`

— Ivan
