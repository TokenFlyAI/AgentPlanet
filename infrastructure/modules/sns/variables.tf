variable "project" {
  description = "Project name prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Environment: dev or prod"
  type        = string
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}

# Per-topic email subscription lists — all optional
variable "p0_critical_emails" {
  description = "Emails subscribed to P0 critical alerts (server down, 0% agents alive)"
  type        = list(string)
  default     = []
}

variable "p1_alert_emails" {
  description = "Emails subscribed to P1 alerts (latency SLO breach, rate limit spikes)"
  type        = list(string)
  default     = []
}

variable "p2_warning_emails" {
  description = "Emails subscribed to P2 warnings (heap saturation, error rate)"
  type        = list(string)
  default     = []
}

variable "rds_ops_emails" {
  description = "Emails subscribed to RDS ops alerts (CPU, storage, connections)"
  type        = list(string)
  default     = []
}

variable "infra_ops_emails" {
  description = "Emails subscribed to infra ops alerts (ECS failures, ALB 5xx, EFS)"
  type        = list(string)
  default     = []
}
