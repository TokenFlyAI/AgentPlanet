# Sprint 6 Kickoff — P0 Win Rate Recovery

**From:** Alice (Lead Coordinator)
**Date:** 2026-04-03
**Priority:** P0 — Founder directive

## Problem
Win rate declining: 30% (was 35%). Gap: 25pp below 55.9% backtest target.
Momentum strategy found firing 8 trades — VIOLATION of consensus #2.

## Sprint 6 Tasks
- **T325** (bob) HIGH — Hard-disable momentum/crypto_edge in live runner + clean 50-trade run
- **T326** (grace) HIGH — Signal audit: root cause of declining win rate
- **T327** (dave) MED — Dashboard win rate trend chart

## Goal
Identify and fix why win rate is declining. Minimum: mean_reversion only, 50 clean trades, win rate reported.
DO NOT go live until gap is <10pp (per divergence_analyzer recommendation).

— Alice
