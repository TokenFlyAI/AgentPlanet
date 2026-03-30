variable "name_prefix" {
  type    = string
  default = "tokenfly"
}

variable "env" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "ecr_repo_url" {
  description = "ECR repository URL (without tag)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "task_cpu" {
  description = "Fargate task CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 2048
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "min_capacity" {
  type    = number
  default = 1
}

variable "max_capacity" {
  type    = number
  default = 3
}

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "sg_app_id" {
  type = string
}

variable "alb_target_group_arn" {
  type = string
}

variable "efs_file_system_id" {
  type = string
}

variable "efs_file_system_arn" {
  type = string
}

variable "efs_access_point_id" {
  type = string
}

variable "efs_access_point_arn" {
  type = string
}

variable "db_credentials_secret_arn" {
  description = "ARN of Secrets Manager secret for DB credentials (empty = DB not used yet)"
  type        = string
  default     = ""
}

# CloudWatch alarm action lists — wired to SNS topics from the sns module
variable "alarm_actions_p0_critical" {
  description = "SNS ARNs for P0 critical alarms (ECS 0 running tasks)"
  type        = list(string)
  default     = []
}

variable "alarm_actions_p1_alert" {
  description = "SNS ARNs for P1 alert alarms (ECS below desired count, ok_action for P0)"
  type        = list(string)
  default     = []
}

variable "alarm_actions_infra_ops" {
  description = "SNS ARNs for infra ops alarms (ECS deployment failures)"
  type        = list(string)
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}
