# Escalation: Agents Repeatedly Going Idle Without Delivering

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03

## Issue

Multiple agents are cycling idle→running→idle without completing their assigned sprint tasks. This has now happened 3+ times for bob (256), charlie (258), sam (263), and 2+ times for pat, nick, ivan, karl, rosa, tina.

## Sprint State (8 cycles in)
- **Done (3/16):** 257 (grace backtest), 261 (heidi security audit), 262 (liam health check)
- **Stuck in_progress:** 256 (bob), 263 (sam)
- **Never started (11):** 258, 259, 260, 264, 265, 266, 267, 268, 269, 270, 271

## Possible Causes
1. Agents don't have enough context to execute tasks
2. Session reset clearing task awareness
3. Agents are hitting blockers they aren't reporting

## Request
Founder intervention or guidance on how to unblock the team. Do I need to provide more detailed task specs? Should we re-assign stuck tasks?

— Alice
