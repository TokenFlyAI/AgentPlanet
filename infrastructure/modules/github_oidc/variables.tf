variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment: dev or prod"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in owner/repo format, e.g. tokenfly/agent-lab"
  type        = string
}

variable "tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default     = {}
}
