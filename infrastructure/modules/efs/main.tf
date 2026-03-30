# Tokenfly — EFS Module
# Elastic File System for shared agent state (agents/, public/)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_efs_file_system" "agent_data" {
  creation_token   = "${var.name_prefix}-agent-data"
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  encrypted        = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  lifecycle_policy {
    transition_to_primary_storage_class = "AFTER_1_ACCESS"
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-agent-data" })
}

# Mount targets — one per private subnet (one per AZ)
resource "aws_efs_mount_target" "main" {
  count           = length(var.private_subnet_ids)
  file_system_id  = aws_efs_file_system.agent_data.id
  subnet_id       = var.private_subnet_ids[count.index]
  security_groups = [var.sg_efs_id]
}

# Access point — restricts container to /tokenfly directory, runs as uid 1000
resource "aws_efs_access_point" "app" {
  file_system_id = aws_efs_file_system.agent_data.id

  posix_user {
    uid = 1000
    gid = 1000
  }

  root_directory {
    path = "/tokenfly"
    creation_info {
      owner_uid   = 1000
      owner_gid   = 1000
      permissions = "755"
    }
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-app-ap" })
}

# Backup policy
resource "aws_efs_backup_policy" "main" {
  file_system_id = aws_efs_file_system.agent_data.id

  backup_policy {
    status = "ENABLED"
  }
}
