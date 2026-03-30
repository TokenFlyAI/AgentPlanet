output "p0_critical_topic_arn" {
  description = "ARN of the P0 critical SNS topic (server down, 0% agents alive)"
  value       = aws_sns_topic.p0_critical.arn
}

output "p1_alert_topic_arn" {
  description = "ARN of the P1 alert SNS topic (latency SLO breach, >50% agents stale)"
  value       = aws_sns_topic.p1_alert.arn
}

output "p2_warning_topic_arn" {
  description = "ARN of the P2 warning SNS topic (heap saturation, elevated error rate)"
  value       = aws_sns_topic.p2_warning.arn
}

output "rds_ops_topic_arn" {
  description = "ARN of the RDS ops SNS topic (CPU, storage, connections)"
  value       = aws_sns_topic.rds_ops.arn
}

output "infra_ops_topic_arn" {
  description = "ARN of the infra ops SNS topic (ECS failures, ALB 5xx, EFS)"
  value       = aws_sns_topic.infra_ops.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used to encrypt all SNS topics"
  value       = aws_kms_key.sns.arn
}

# ---------------------------------------------------------------------------
# Backward-compat aliases — used by main.tf (rds module) and outputs.tf
# ---------------------------------------------------------------------------
output "critical_topic_arn" {
  description = "Alias for p0_critical_topic_arn — used by RDS module alarm_actions_critical"
  value       = aws_sns_topic.p0_critical.arn
}

output "warning_topic_arn" {
  description = "Alias for p2_warning_topic_arn — used by RDS module alarm_actions_warning"
  value       = aws_sns_topic.p2_warning.arn
}
