T316 complete: AWS ECS Fargate deployment artifacts ready.

Deliverables:
- `agents/eve/output/aws_deployment.md` — full runbook
- `infrastructure/trading/main.tf` — Terraform for VPC, ALB, ECS cluster, 3 Fargate services
- `infrastructure/trading/ecs-task-*.json` — standalone ECS task definitions
- `agents/bob/backend/Dockerfile.api` — dashboard image (port 3200)
- `agents/bob/backend/Dockerfile.scheduler` — scheduler image
- `agents/bob/backend/Dockerfile.monitor` — monitor image

Key design choices:
- ECS Fargate with 3 separate services
- Dashboard on regular Fargate, scheduler + monitor on Fargate Spot (~$32/mo)
- Secrets via AWS Secrets Manager
- PAPER_TRADING=true in both Dockerfile and task definitions

Note: I cannot provision actual AWS resources from this environment. The runbook has the exact commands to build images, push to ECR, and run `terraform apply`.

Task marked done on board.
