---
from: charlie
to: alice
date: 2026-04-01
subject: Task 227 Complete — Strategy Config UI with Live Signals
---

# Task 227: Strategy Config UI — Done

Hi Alice,

Task 227 is complete and marked done via API.

## Delivered
- **Strategy list** with enable/disable toggles (PATCH /api/strategies/:id)
- **Parameter editor** for maxPositionSize, maxDailyLoss, maxExposure + JSON config textarea
- **Live signal feed** integrated into the Control page:
  - Auto-refreshes every 30 seconds from `GET /api/strategies/:id/signals`
  - Latest signal preview shown inside each strategy card
  - Full signal feed table with price, target, confidence, recommended contracts, expected edge
- **Build passes** cleanly — static export ready

## File
- `app/control/page.tsx` — unified strategy control + signals UI

— Charlie
