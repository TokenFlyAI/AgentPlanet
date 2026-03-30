# Tokenfly — Application-Level CloudWatch Alarms
# Rosa (Distributed Systems) — Task #116 — 2026-03-30
#
# These alarms cover application-level signals (ALT-001 through ALT-010) from
# Liam's SRE plan (agents/liam/output/sre_plan.md). They use custom CloudWatch
# metrics published from server.js under the "Tokenfly/API" namespace.
#
# Infrastructure-level alarms (ECS, ALB, RDS) are wired inside their respective
# modules and passed SNS ARNs via main.tf. This file handles everything above
# the infrastructure layer.
#
# Metric emission: server.js calls aws-sdk CloudWatch.putMetricData() on each
# request cycle (or via scripts/healthcheck.js for synthetic checks).
# Custom namespace: "Tokenfly/API"
#
# ALT mapping to SNS topics:
#   P0 → module.sns.p0_critical_topic_arn
#   P1 → module.sns.p1_alert_topic_arn
#   P2 → module.sns.p2_warning_topic_arn
# ---------------------------------------------------------------------------

locals {
  # Dimensions common to all application-level alarms
  app_dimension = {
    Environment = var.env
    Service     = "tokenfly-api"
  }
}

# ---------------------------------------------------------------------------
# ALT-001 / ALT-008 — Server Unreachable (health check non-200)
# Metric: HealthCheckStatus (0 = unhealthy, 1 = healthy)
# Source: scripts/healthcheck.js polls GET /api/health every 30s → CW metric
# Severity: P0
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_health_check_failed" {
  alarm_name          = "${local.name_prefix}-app-health-check-failed"
  alarm_description   = "ALT-001/ALT-008: /api/health returned non-200 or timed out for > 1 minute — server unreachable"
  namespace           = "Tokenfly/API"
  metric_name         = "HealthCheckStatus"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching" # missing data means health check script is down too

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p0_critical_topic_arn]
  ok_actions    = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-002 — /api/health p99 latency > 500ms for 5 minutes
# Metric: HealthEndpointP99LatencyMs
# Source: scripts/healthcheck.js publishes measured response times
# Severity: P1
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_health_p99_latency_high" {
  alarm_name          = "${local.name_prefix}-app-health-p99-latency-high"
  alarm_description   = "ALT-002: /api/health p99 response time > 500ms for 5 minutes — server saturated"
  namespace           = "Tokenfly/API"
  metric_name         = "HealthEndpointP99LatencyMs"
  extended_statistic  = "p99"
  period              = 300
  evaluation_periods  = 1
  threshold           = 500
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-003 — /api/agents p95 latency > 1000ms for 10 minutes
# Metric: AgentsEndpointP95LatencyMs
# Source: server.js apiMetrics middleware publishes per-endpoint percentiles
# Severity: P1
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_agents_p95_latency_high" {
  alarm_name          = "${local.name_prefix}-app-agents-p95-latency-high"
  alarm_description   = "ALT-003: /api/agents p95 response time > 1000ms for 10 minutes — disk I/O or file-read saturation"
  namespace           = "Tokenfly/API"
  metric_name         = "AgentsEndpointP95LatencyMs"
  extended_statistic  = "p95"
  period              = 300
  evaluation_periods  = 2
  threshold           = 1000
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-004 — /api/tasks p95 latency > 800ms for 10 minutes
# Metric: TasksEndpointP95LatencyMs
# Source: server.js apiMetrics middleware
# Severity: P2
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_tasks_p95_latency_high" {
  alarm_name          = "${local.name_prefix}-app-tasks-p95-latency-high"
  alarm_description   = "ALT-004: /api/tasks p95 response time > 800ms for 10 minutes — task_board.md parse overhead or GC pressure"
  namespace           = "Tokenfly/API"
  metric_name         = "TasksEndpointP95LatencyMs"
  extended_statistic  = "p95"
  period              = 300
  evaluation_periods  = 2
  threshold           = 800
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p2_warning_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-005 — 0% agents alive (all heartbeats stale) — complete agent outage
# Metric: AliveAgentCount
# Source: scripts/heartbeat_monitor.js polls agent heartbeat mtimes every 60s
# Severity: P0
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_zero_agents_alive" {
  alarm_name          = "${local.name_prefix}-app-zero-agents-alive"
  alarm_description   = "ALT-005: All agent heartbeats stale — 0 agents alive. Complete team outage. P0."
  namespace           = "Tokenfly/API"
  metric_name         = "AliveAgentCount"
  statistic           = "Minimum"
  period              = 120
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching" # no data = monitor is down, assume worst case

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p0_critical_topic_arn]
  ok_actions    = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-006 — < 25% agents alive for > 10 minutes
# Metric: AliveAgentPercent (0–100)
# Source: scripts/heartbeat_monitor.js publishes alive_pct every 60s
# Severity: P1
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_low_agent_liveness" {
  alarm_name          = "${local.name_prefix}-app-low-agent-liveness"
  alarm_description   = "ALT-006: Fewer than 25% of agents are alive for > 10 minutes — systemic agent failure or disk issue"
  namespace           = "Tokenfly/API"
  metric_name         = "AliveAgentPercent"
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 25
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-007 — 429 rate > 10% of write requests in 5-minute window
# Metric: RateLimitedRequestPercent (0–100)
# Source: server.js apiMetrics middleware tracks 429 count per write endpoint
# Severity: P1 (SRE plan lists this as P2 but 10% threshold is worth P1 paging)
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_rate_limit_spike" {
  alarm_name          = "${local.name_prefix}-app-rate-limit-spike"
  alarm_description   = "ALT-007: 429 responses exceed 10% of write requests in 5-minute window — client bug, abuse, or limiter too tight"
  namespace           = "Tokenfly/API"
  metric_name         = "RateLimitedRequestPercent"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 10
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-009 — Heap utilization > 85% for > 5 minutes
# Metric: HeapUtilizationPercent (0–100; heapUsed/heapTotal * 100)
# Source: scripts/healthcheck.js reads /api/health.memory fields
# Severity: P1
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_heap_high" {
  alarm_name          = "${local.name_prefix}-app-heap-high"
  alarm_description   = "ALT-009: Node.js heap utilization > 85% for 5 minutes — GC pressure, possible OOM imminent"
  namespace           = "Tokenfly/API"
  metric_name         = "HeapUtilizationPercent"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 85
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# ALT-010 — HTTP 5xx error rate > 1% over 5 minutes
# Metric: ErrorRatePercent (5xx / total * 100)
# Source: server.js apiMetrics middleware tracks 5xx responses
# Severity: P2
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "app_error_rate_high" {
  alarm_name          = "${local.name_prefix}-app-error-rate-high"
  alarm_description   = "ALT-010: HTTP 5xx error rate > 1% over 5 minutes — unhandled exceptions or downstream failures"
  namespace           = "Tokenfly/API"
  metric_name         = "ErrorRatePercent"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.app_dimension

  alarm_actions = [module.sns.p2_warning_topic_arn]

  tags = local.common_tags

  depends_on = [module.sns]
}

# ---------------------------------------------------------------------------
# CloudWatch Composite Alarm — P0 Complete Outage
# Fires if BOTH health check fails AND zero agents alive simultaneously.
# Reduces noise from individual transient failures.
# ---------------------------------------------------------------------------
resource "aws_cloudwatch_composite_alarm" "app_complete_outage" {
  alarm_name        = "${local.name_prefix}-app-complete-outage"
  alarm_description = "COMPOSITE P0: Server unreachable AND all agents down simultaneously — full system failure"

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.app_health_check_failed.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.app_zero_agents_alive.alarm_name})"

  alarm_actions = [module.sns.p0_critical_topic_arn]
  ok_actions    = [module.sns.p1_alert_topic_arn]

  tags = local.common_tags

  depends_on = [
    aws_cloudwatch_metric_alarm.app_health_check_failed,
    aws_cloudwatch_metric_alarm.app_zero_agents_alive,
    module.sns,
  ]
}
