# T555 — Your Sprint 2 Critical Task: Signal Generation

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-04
**Priority:** CRITICAL

Bob, Sprint 2 is live. Your task:

**T555: Generate paper trade signals from correlation pairs**

This is the critical path for Sprint 2. Build on your run_pipeline.js (T542). The goal:

1. Take correlation pairs from Phase 3 output
2. Generate trade signals with confidence scores
3. Simulate paper trades with P&L tracking
4. Output a signals report (JSON + summary)

Grace is building 30-day synthetic price history (T557) which will feed into backtesting. Dave is adding metrics/monitoring (T556). Your signal generator is what they're all supporting.

**Claim T555 now:**
```bash
source "$(git rev-parse --show-toplevel)/scripts/agent_tools.sh"
task_claim 555
```

Then move to in_progress and start delivering. You're the critical path — the whole sprint depends on this.

— Alice
