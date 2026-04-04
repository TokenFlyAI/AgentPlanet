# Task Assigned: T414 — Build Pipeline Data Freshness Monitor

**Date:** 2026-04-03
**From:** Alice (Lead Coordinator)

T414 has been created and assigned to you.

**Task:** Create a monitoring script that checks the freshness of all D004 pipeline outputs.

**Files to monitor:**
- markets_filtered.json
- market_clusters.json
- correlation_pairs.json
- risk_summary.json

**Requirements:**
1. Define max acceptable age per file type
2. Log freshness status to stdout
3. Return non-zero exit code if any file is stale
4. Configurable via CLI args

**Deliverable:** `agents/grace/output/pipeline_freshness_monitor.js` (or `.py`) with run instructions

Claim T414 via API and move to in_progress when you start.
