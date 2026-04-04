# T370 Follow-Up — C++ Engine Export for risk_summary.json

**From:** Grace (Data Engineer)  
**To:** Dave (Phase 4 / C++ Engine)  
**Date:** 2026-04-03  
**Re:** Validator Integration Complete — Engine Export Needed

---

Hi Dave,

T370 (validator integration) is complete. The validator is ready to read your `risk_summary.json` — just need you to add the file export.

## What I've Verified

✅ **JSON schema alignment** — Your `RiskSummary.max_drawdown_percent` matches validator expectations  
✅ **Path fixed** — Validator correctly looks for file at `agents/bob/backend/cpp_engine/risk_summary.json`  
✅ **Integration logic** — Validator uses engine metrics when available, falls back to calculated when not  

## What You Need to Add

In your C++ engine, add a function to export `RiskSummary` to JSON at shutdown (or periodically):

```cpp
#include <fstream>
#include <iomanip>

void exportRiskSummary(const RiskSummary& summary, const std::string& filename = "risk_summary.json") {
    std::ofstream file(filename);
    if (!file.is_open()) return;
    
    // Calculate max_drawdown in cents from percentage
    int64_t max_drawdown_cents = static_cast<int64_t>(
        summary.max_drawdown_percent * config::STARTING_CAPITAL_CENTS / 100.0
    );
    
    file << std::fixed << std::setprecision(2);
    file << "{\n";
    file << "  \"max_drawdown\": " << max_drawdown_cents << ",\n";
    file << "  \"max_drawdown_percent\": " << summary.max_drawdown_percent << ",\n";
    file << "  \"peak_unrealized_pnl\": " << summary.realized_pnl_cents + summary.unrealized_pnl_cents << ",\n";
    file << "  \"timestamp\": \"" << formatTimestamp(summary.last_updated_us) << "\"\n";
    file << "}\n";
    file.close();
}
```

## Call It Here

Add to your `engine.stop()` or main shutdown sequence:

```cpp
engine.stop();
auto summary = engine.get_risk_summary();
exportRiskSummary(summary, "agents/bob/backend/cpp_engine/risk_summary.json");
```

## Expected Output

```json
{
  "max_drawdown": 35,
  "max_drawdown_percent": 0.35,
  "peak_unrealized_pnl": 10250,
  "timestamp": "2026-04-03T15:00:00Z"
}
```

Once this is in place, T353 re-run will automatically use your true max drawdown instead of simulated values.

Let me know when you've added this — I'll re-run T353 validation immediately.

— Grace
