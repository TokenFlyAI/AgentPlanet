# Tokenfly — RDS Module
# PostgreSQL 15 via RDS, private subnets, Secrets Manager credentials
# Quinn (Cloud Engineer) — 2026-03-29

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# ---------------------------------------------------------------------------
# DB Subnet Group — private subnets only
# ---------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name        = "${var.name_prefix}-rds-subnet-group"
  description = "Tokenfly RDS subnet group — private subnets"
  subnet_ids  = var.private_subnet_ids

  tags = merge(var.tags, { Name = "${var.name_prefix}-rds-subnet-group" })
}

# ---------------------------------------------------------------------------
# Parameter Group — PostgreSQL 15 tuning
# ---------------------------------------------------------------------------

resource "aws_db_parameter_group" "main" {
  name        = "${var.name_prefix}-pg15"
  family      = "postgres15"
  description = "Tokenfly PostgreSQL 15 parameter group"

  # Connection pooling friendliness
  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  # Log slow queries (> 1 second)
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  # Enforce SSL connections
  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "immediate"
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-pg15-params" })
}

# ---------------------------------------------------------------------------
# Credentials — Secrets Manager
# The app reads DATABASE_URL from this secret at runtime.
# ---------------------------------------------------------------------------

resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.name_prefix}/rds/credentials"
  description             = "Tokenfly RDS PostgreSQL credentials"
  recovery_window_in_days = var.env == "prod" ? 7 : 0

  tags = merge(var.tags, { Name = "${var.name_prefix}-rds-credentials" })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = "tokenfly_app"
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = "tokenfly"
    # Full DSN for Node.js pg / PostgreSQL clients
    url = "postgresql://tokenfly_app:${random_password.db_password.result}@${aws_db_instance.main.address}:5432/tokenfly?sslmode=require"
  })

  # Depends on instance being created so host is available
  depends_on = [aws_db_instance.main]
}

# ---------------------------------------------------------------------------
# RDS Instance — PostgreSQL 15
# ---------------------------------------------------------------------------

resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-postgres"

  # Engine
  engine               = "postgres"
  engine_version       = "${var.postgres_version}"
  instance_class       = var.instance_class
  parameter_group_name = aws_db_parameter_group.main.name

  # Storage
  allocated_storage     = var.allocated_storage_gb
  max_allocated_storage = var.max_allocated_storage_gb > 0 ? var.max_allocated_storage_gb : null
  storage_type          = "gp3"
  storage_encrypted     = true

  # Credentials (set at creation; managed via Secrets Manager after)
  db_name  = "tokenfly"
  username = "tokenfly_app"
  password = random_password.db_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.sg_rds_id]
  publicly_accessible    = false
  port                   = 5432

  # High availability
  multi_az = var.multi_az

  # Backups
  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"   # UTC — low-traffic window
  maintenance_window      = "sun:04:00-sun-05:00"
  copy_tags_to_snapshot   = true

  # Performance Insights (free tier: 7 days retention)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Enhanced monitoring (60-second granularity)
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Ops safety
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.name_prefix}-final-${formatdate("YYYYMMDD", timestamp())}"

  # Auto minor version upgrades — yes for dev, manual for prod
  auto_minor_version_upgrade = var.env != "prod"

  tags = merge(var.tags, { Name = "${var.name_prefix}-postgres" })
}

# ---------------------------------------------------------------------------
# IAM — Enhanced Monitoring Role
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "rds_monitoring_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "rds_monitoring" {
  name               = "${var.name_prefix}-rds-monitoring-role"
  assume_role_policy = data.aws_iam_policy_document.rds_monitoring_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ---------------------------------------------------------------------------
# CloudWatch Alarms — key RDS health signals
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.name_prefix}-rds-cpu-high"
  alarm_description   = "RDS-001: CPU > 80% for 5 minutes"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions_rds_ops

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_low" {
  alarm_name          = "${var.name_prefix}-rds-storage-low"
  alarm_description   = "RDS-002: Free storage < 10 GB"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 10737418240  # 10 GB in bytes (Liam RDS-002 threshold)
  comparison_operator = "LessThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions_rds_ops

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "connections_high" {
  alarm_name          = "${var.name_prefix}-rds-connections-high"
  alarm_description   = "RDS-003: Connection count > 100 for 5 minutes"
  namespace           = "AWS/RDS"
  metric_name         = "DatabaseConnections"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 100
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions_rds_ops

  tags = var.tags
}
