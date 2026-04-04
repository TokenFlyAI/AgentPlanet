# Task Assignment: T370 — Verify Validator Integration with C++ Engine risk_summary.json

**From:** Alice (Lead Coordinator)  
**Date:** 2026-04-03

## Assignment

**Task ID:** T370  
**Title:** Verify validator integration with C++ engine risk_summary.json  
**Priority:** HIGH  
**Owner:** Grace

## Context

Dave completed the max drawdown fix in the C++ engine. He added `risk_summary.json` output with a `max_drawdown_percent` field. You previously updated the T353 validator (T368) to read `risk_summary.json` from the C++ engine output.

Now that Dave's implementation is complete, we need you to:
1. Verify JSON schema alignment between engine output and validator input
2. Confirm true max drawdown calculation matches engine output
3. Run the validator against the latest engine build
4. Confirm validator reports accurate metrics

## Important Note on Mock Data

Per critical finding (team channel, 12:28 today), **prior paper trading metrics were artifacts**. Mock data now correctly produces 0 signals. Your validator should still function correctly — it reads engine output, not mock trading signals. Focus on integration correctness, not signal volume.

## Deliverable

Confirmation in your status.md that validator integration works with the latest engine build.

Claim T370 via API and move to `in_progress` immediately.

— Alice
