# Tokenfly — SNS Topic ARN Exports
# Liam (SRE) — 2026-03-30
#
# Root-level outputs of all 5 SNS topic ARNs for use in CloudWatch alarm_actions.
# Sourced from module.sns (modules/sns/main.tf) which Quinn built based on Liam's SRE plan.
#
# ARN format at runtime:
#   arn:aws:sns:<region>:<account-id>:tokenfly-<env>-<topic>
#
# Usage in CloudWatch alarms (inside modules or root):
#   alarm_actions = [module.sns.p0_critical_topic_arn]
#
# ---------------------------------------------------------------------------
# SNS Topic ARN — full set (all 5 topics)
# ---------------------------------------------------------------------------

output "sns_p0_critical_topic_arn" {
  description = <<-EOT
    P0 Critical — server-down, 0% agents alive.
    Alert IDs: ALT-001 (health endpoint), ALT-006 (0% agents alive).
    Severity: P0 — page on-call immediately.
  EOT
  value = module.sns.p0_critical_topic_arn
}

output "sns_p1_alert_topic_arn" {
  description = <<-EOT
    P1 Alert — latency SLO breach, >50% agents stale, rate-limit spike.
    Alert IDs: ALT-002 (p99 latency), ALT-005 (>50% stale), ALT-010 (429 spike).
    Severity: P1 — acknowledge within 15 min.
  EOT
  value = module.sns.p1_alert_topic_arn
}

output "sns_p2_warning_topic_arn" {
  description = <<-EOT
    P2 Warning — heap saturation, elevated error rate, high latency trend.
    Alert IDs: ALT-003 (p95 latency), ALT-007 (error rate), ALT-008 (5xx rate), ALT-009 (heap).
    Severity: P2 — review within 4 h.
  EOT
  value = module.sns.p2_warning_topic_arn
}

output "sns_rds_ops_topic_arn" {
  description = <<-EOT
    RDS Ops — CPU, storage, connections.
    Alert IDs: ALT-004 (DB connection pool) + RDS CloudWatch alarms from modules/rds/.
    Severity: P1/P2 depending on threshold.
  EOT
  value = module.sns.rds_ops_topic_arn
}

output "sns_infra_ops_topic_arn" {
  description = <<-EOT
    Infra Ops — ECS task failures, ALB 5xx, EFS mount errors.
    Used by ALB and ECS CloudWatch alarms.
    Severity: P1/P2 depending on threshold.
  EOT
  value = module.sns.infra_ops_topic_arn
}

# ---------------------------------------------------------------------------
# Quick-reference — alarm_actions mapping
# ---------------------------------------------------------------------------
#
# CloudWatch alarm severity → SNS topic:
#
#   P0  server down / 0% agents alive  → module.sns.p0_critical_topic_arn
#   P1  latency SLO / >50% stale      → module.sns.p1_alert_topic_arn
#   P2  heap / error rate / warning    → module.sns.p2_warning_topic_arn
#   DB  RDS CPU / storage / conns      → module.sns.rds_ops_topic_arn
#   ALB ECS failures / 5xx / EFS       → module.sns.infra_ops_topic_arn
#
# RDS module (modules/rds/) uses backward-compat aliases:
#   alarm_actions_critical = [module.sns.critical_topic_arn]  → p0_critical
#   alarm_actions_warning  = [module.sns.warning_topic_arn]   → p2_warning
#
# ---------------------------------------------------------------------------
