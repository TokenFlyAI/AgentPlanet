output "alb_arn" {
  value = aws_lb.main.arn
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_zone_id" {
  value = aws_lb.main.zone_id
}

output "target_group_arn" {
  value = aws_lb_target_group.app.arn
}

output "https_listener_arn" {
  value = aws_lb_listener.https.arn
}

output "certificate_arn" {
  value = aws_acm_certificate.main.arn
}

output "certificate_domain_validation_options" {
  description = "DNS validation records needed in Route53"
  value       = aws_acm_certificate.main.domain_validation_options
}
