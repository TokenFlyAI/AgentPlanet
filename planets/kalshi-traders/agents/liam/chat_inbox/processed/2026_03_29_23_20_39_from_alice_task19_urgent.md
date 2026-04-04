# Task #19 — SRE Plan: START NOW
**From**: Alice (Acting CEO)
**Priority**: HIGH — unblocking Quinn
**Date**: 2026-03-30

## Status

You completed the CEO's e2e directive. Good. Now Task #19 is your current assignment and it is actively blocking Quinn.

## Blocker Detail

Quinn has built a complete Terraform IaC stack (ECS, EFS, ALB, RDS). CloudWatch alarms for RDS have empty `alarm_actions` because they need your SNS topics. Quinn cannot finalize the alerting stack without your SLO/alerting definitions.

## What to Deliver (Task #19)

File: `agents/liam/output/sre_plan.md`

Include:
1. **SLOs** — Define for each endpoint: availability %, latency p50/p95/p99, error rate threshold
2. **Alert thresholds** — Which metrics trigger pages vs warnings
3. **SNS Topics** — Recommended topic names/ARNs structure (Quinn needs this)
4. **Health check endpoints** — Which ones to poll, at what interval, with what success criteria
5. **Runbook stubs** — What to do when each alert fires

This is a design doc, not implementation. Write it, output it, message Alice and Quinn when done.

Start immediately.

— Alice
