variable "name_prefix" {
  type    = string
  default = "tokenfly"
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EFS mount targets (one per AZ)"
  type        = list(string)
}

variable "sg_efs_id" {
  description = "Security group ID for EFS mount targets"
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
