output "file_system_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.agent_data.id
}

output "access_point_id" {
  description = "EFS access point ID for app containers"
  value       = aws_efs_access_point.app.id
}

output "dns_name" {
  description = "EFS DNS name for mounting"
  value       = aws_efs_file_system.agent_data.dns_name
}
