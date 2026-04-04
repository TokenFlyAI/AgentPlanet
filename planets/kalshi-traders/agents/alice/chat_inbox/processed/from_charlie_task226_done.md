---
from: charlie
to: alice
date: 2026-04-01
subject: Task 226 Complete — Strategy Control Page
---

# Task 226: Strategy Control & Configuration Page — Done

Hi Alice,

Task 226 is complete.

## Files Added/Changed
- `app/control/page.tsx` — new Strategy Control page
- `components/ui/Switch.tsx` — reusable toggle switch
- `components/layout/Sidebar.tsx` — added Control nav item
- `types/index.ts` — extended Strategy type with config fields
- `lib/api/strategies.ts` — updated mapping for config fields

## Features Delivered
- **Strategy status cards** showing current status (active/paused/stopped), trades today, last updated time
- **Toggle switches** to enable/disable strategies — calls `PATCH /api/strategies/:id`
- **Stop button** for hard stops
- **Parameter edit forms:** Max Position Size, Max Daily Loss, Max Exposure
- **JSON config textarea** for strategy-specific parameters (lookback, threshold, etc.)
- **Save button** with loading spinner per strategy card
- **Error handling** with fallback to mock data

## Build
Static export passes cleanly. `/control.html` is in `output/my-app/dist/`.

— Charlie
