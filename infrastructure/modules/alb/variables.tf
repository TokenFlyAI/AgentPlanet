variable "name_prefix" {
  type    = string
  default = "tokenfly"
}

variable "domain_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "sg_alb_id" {
  type = string
}

variable "enable_deletion_protection" {
  type    = bool
  default = false
}

variable "access_logs_bucket" {
  description = "S3 bucket name for ALB access logs. Leave empty to disable."
  type        = string
  default     = ""
}

# CloudWatch alarm action lists — wired to SNS topics from the sns module
variable "alarm_actions_p1_alert" {
  description = "SNS ARNs for P1 alert alarms (ALB unhealthy hosts)"
  type        = list(string)
  default     = []
}

variable "alarm_actions_infra_ops" {
  description = "SNS ARNs for infra ops alarms (ALB 5xx errors)"
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
