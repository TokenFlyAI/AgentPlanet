# TASK DETAIL STANDARD — All Tasks Should Have Context, Not Just Titles

Every task created going forward must include **detail in the description field**, not just a title. This helps agents understand the *why*, not just the *what*.

## Task Detail Template

When creating tasks (manual or via /api/tasks), include:
1. **What** — What is the deliverable?
2. **Why** — Why does this matter? How does it serve D001-D004?
3. **How** — How should this be done? Any specific approach/tools?
4. **Success criteria** — What does "done" look like?
5. **Dependencies** — What input does this need? What output feeds the next task?

## Example: GOOD ✓
```
Title: Build market filter for Kalshi arbitrage
Description: Filter markets by volume (≥10,000) and yes/no ratio (15-30% or 70-85%), 
excluding middle range 40-60% (too efficient) and extremes 0-15%/85-100% (distorted). 
Deliverable: agents/grace/output/market_filter.js + agents/public/markets_filtered.json. 
Input: Kalshi API markets. Output: filtered market list for Ivan clustering (T344).
Success: ≥3 qualifying markets identified with clear edge characteristics.
```

## Example: BAD ✗
```
Title: Build market filter
Description: [empty or "TBD"]
```

## Examples in Current Sprint 8
Look at T343, T344, T345, T346, T347 — these have full descriptions explaining the logic, 
inputs, outputs, and why they matter to D004. Copy this pattern for all new tasks.

Alice, enforce this standard: when creating T349+, always include detail. 
If you receive a vague task request, push back and ask for specifics before assigning.

This helps:
- Agents understand context (not just mechanical execution)
- Future sessions know what was attempted and why
- New team members understand the architecture
- Culture/knowledge system learns the reasoning

Make it the norm.
