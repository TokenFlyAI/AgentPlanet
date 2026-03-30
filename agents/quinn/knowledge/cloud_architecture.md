# Tokenfly Agent Team Lab — Cloud Architecture

**Author**: Quinn (Cloud Engineer)
**Date**: 2026-03-29
**Status**: Draft — Proposal for Production Deployment

---

## 1. System Overview

Tokenfly Agent Team Lab is a Node.js application consisting of:

| Component | Description | File |
|-----------|-------------|------|
| Web Server | Express-like HTTP server, serves dashboard + API | `server.js` |
| Backend API | REST API for agents, tasks, messages, health | `backend/api.js` |
| Agent State | File-based agent memory (status.md, heartbeat.md) | `agents/{name}/` |
| Shared State | Task board, announcements, team channel | `public/` |
| Agent Processes | 20 Claude Code subprocess agents | `run_agent.sh` |

**Key characteristics**:
- Node.js runtime (no framework dependency)
- File-based storage as primary state (not a database yet — Pat is formalizing schema)
- 20 long-running agent subprocesses per deployment
- Read/write heavy on shared filesystem (`public/task_board.md`, agent inboxes)
- Dashboard served as static HTML + JS polling `/api/*` endpoints

---

## 2. Target Cloud Architecture (AWS)

### 2.1 Architecture Diagram

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                     AWS us-east-1                        │
                        │                                                           │
   Users ──────────────►│  CloudFront (CDN)                                        │
                        │       │                                                   │
                        │       ▼                                                   │
                        │  ALB (Application Load Balancer)                         │
                        │       │                                                   │
                        │   ┌───┴────────────────────────┐                         │
                        │   │      VPC (10.0.0.0/16)     │                         │
                        │   │                            │                         │
                        │   │  ┌─────────────────────┐  │                         │
                        │   │  │  ECS Fargate Service │  │                         │
                        │   │  │  (tokenfly-app)      │  │                         │
                        │   │  │  1–3 tasks           │  │                         │
                        │   │  │  1024 CPU / 2048 MB  │  │                         │
                        │   │  └──────────┬──────────┘  │                         │
                        │   │             │              │                         │
                        │   │             ▼              │                         │
                        │   │  ┌─────────────────────┐  │                         │
                        │   │  │  EFS (Elastic File   │  │                         │
                        │   │  │  System)             │  │                         │
                        │   │  │  agents/ + public/   │  │                         │
                        │   │  └─────────────────────┘  │                         │
                        │   │                            │                         │
                        │   │  ┌─────────────────────┐  │                         │
                        │   │  │  RDS PostgreSQL       │  │                         │
                        │   │  │  (future — Pat's     │  │                         │
                        │   │  │   schema migration)  │  │                         │
                        │   │  └─────────────────────┘  │                         │
                        │   └────────────────────────────┘                         │
                        │                                                           │
                        │  S3 (logs, archives, backups)                            │
                        └─────────────────────────────────────────────────────────┘
```

### 2.2 Component Decisions

| Component | Choice | Reasoning |
|-----------|--------|-----------|
| Compute | ECS Fargate | Serverless containers — no EC2 management, scales to zero, pay-per-use |
| Shared storage | EFS | POSIX filesystem — agents read/write files; EFS mounts directly to Fargate tasks |
| CDN | CloudFront | Cache static dashboard assets; reduce origin load |
| Load balancer | ALB | HTTP routing, health checks on `/api/health`, TLS termination |
| Database | RDS PostgreSQL (future) | When Pat's schema is ready; migrate from file-based to DB |
| Logs | CloudWatch Logs | Centralized logging for all agent stdout/stderr |
| Secrets | SSM Parameter Store | API keys, environment vars — never in container image |
| Networking | VPC + private subnets | ECS and EFS in private subnets; only ALB in public |

---

## 3. Network Architecture

### 3.1 VPC Design

```
VPC: 10.0.0.0/16

Public Subnets (ALB, NAT Gateway):
  us-east-1a: 10.0.1.0/24
  us-east-1b: 10.0.2.0/24

Private Subnets (ECS Fargate, EFS, RDS):
  us-east-1a: 10.0.10.0/24
  us-east-1b: 10.0.11.0/24
```

### 3.2 Security Groups

| SG | Inbound | Outbound |
|----|---------|----------|
| `sg-alb` | 443 from 0.0.0.0/0 | 3100 to sg-app |
| `sg-app` | 3100 from sg-alb | 2049 to sg-efs, 5432 to sg-rds, 443 to 0.0.0.0/0 |
| `sg-efs` | 2049 from sg-app | — |
| `sg-rds` | 5432 from sg-app | — |

Principle: least-privilege. No direct internet access to compute or storage.

---

## 4. Terraform Module Structure

```
infrastructure/
├── main.tf                  — root module, calls sub-modules
├── variables.tf
├── outputs.tf
├── terraform.tfvars         — (gitignored, per-env values)
├── modules/
│   ├── networking/          — VPC, subnets, SGs, NAT, IGW
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/                 — Fargate cluster, service, task definition
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── efs/                 — EFS filesystem, mount targets, access points
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── alb/                 — ALB, target group, listener, ACM cert
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── cloudfront/          — CloudFront distribution
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── rds/                 — RDS PostgreSQL (disabled by default)
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/                 — Dev environment (smaller instances, no multi-AZ)
    └── prod/                — Prod environment (multi-AZ, larger instances)
```

---

## 5. Key Terraform Resources

### 5.1 ECS Task Definition (excerpt)

```hcl
resource "aws_ecs_task_definition" "tokenfly_app" {
  family                   = "tokenfly-app"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024  # 1 vCPU
  memory                   = 2048  # 2 GB

  container_definitions = jsonencode([{
    name      = "tokenfly-app"
    image     = "${var.ecr_repo_url}:${var.image_tag}"
    essential = true

    portMappings = [{ containerPort = 3100, protocol = "tcp" }]

    environment = [
      { name = "PORT",    value = "3100" },
      { name = "DIR",     value = "/data" },
      { name = "NODE_ENV", value = var.env }
    ]

    mountPoints = [{
      sourceVolume  = "agent-data"
      containerPath = "/data"
      readOnly      = false
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/tokenfly-app"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])

  volume {
    name = "agent-data"
    efs_volume_configuration {
      file_system_id     = aws_efs_file_system.agent_data.id
      transit_encryption = "ENABLED"
      authorization_config {
        access_point_id = aws_efs_access_point.app.id
        iam             = "ENABLED"
      }
    }
  }
}
```

### 5.2 EFS Configuration

```hcl
resource "aws_efs_file_system" "agent_data" {
  creation_token   = "tokenfly-agent-data"
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  encrypted        = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = { Name = "tokenfly-agent-data", Env = var.env }
}

resource "aws_efs_access_point" "app" {
  file_system_id = aws_efs_file_system.agent_data.id
  posix_user     { uid = 1000; gid = 1000 }
  root_directory {
    path = "/tokenfly"
    creation_info { owner_uid = 1000; owner_gid = 1000; permissions = "755" }
  }
}
```

### 5.3 ALB Health Check

```hcl
resource "aws_lb_target_group" "app" {
  name        = "tokenfly-app-tg"
  port        = 3100
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
}
```

---

## 6. Cost Estimate (Monthly, us-east-1)

### Development Environment

| Resource | Spec | Est. Cost/mo |
|----------|------|-------------|
| ECS Fargate | 1 task × 1 vCPU × 2 GB × 730h | ~$30 |
| EFS | 5 GB active + bursting | ~$2 |
| ALB | 1 ALB + 730h | ~$22 |
| NAT Gateway | ~10 GB/mo data | ~$5 |
| CloudWatch Logs | ~1 GB/mo | ~$0.50 |
| **Dev Total** | | **~$60/mo** |

### Production Environment

| Resource | Spec | Est. Cost/mo |
|----------|------|-------------|
| ECS Fargate | 2 tasks × 1 vCPU × 2 GB × 730h | ~$60 |
| EFS | 20 GB + multi-AZ mount | ~$10 |
| ALB | 1 ALB + moderate LCUs | ~$25 |
| NAT Gateway | 2 AZs × 50 GB data | ~$20 |
| CloudFront | 100 GB transfer | ~$9 |
| CloudWatch Logs | 5 GB/mo + 30d retention | ~$5 |
| RDS PostgreSQL | db.t4g.micro, single-AZ (dev), multi-AZ (prod) | ~$25 / ~$50 |
| **Prod Total** | | **~$130–155/mo** |

**Cost optimization levers**:
- Spot/Fargate Spot for non-critical agent tasks: up to 70% compute savings
- EFS Intelligent Tiering: auto-moves cold data to IA storage (~$0.025/GB vs $0.08/GB)
- CloudFront caches dashboard HTML/JS: reduces ALB + origin traffic by ~60%
- Reserved capacity for ALB and NAT if usage is predictable: ~30% savings

---

## 7. Container Image Strategy

```dockerfile
# infrastructure/docker/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy application code (not agent state — that lives on EFS)
COPY package*.json ./
RUN npm ci --only=production

COPY server.js .
COPY backend/ ./backend/
COPY public/ ./public/  # static templates only — runtime data on EFS
COPY index_lite.html .

# Agent state dir is mounted from EFS at runtime
VOLUME ["/data"]

ENV PORT=3100
ENV DIR=/data

EXPOSE 3100
CMD ["node", "server.js", "--port", "3100", "--dir", "/data"]
```

**Image tagging strategy**:
- `sha-{git-sha}` — immutable, tied to commit
- `env-dev-latest`, `env-prod-latest` — mutable pointers for rollback
- Never tag `latest` as the only tag — always include sha

**ECR lifecycle policy**: Keep last 10 tagged images; expire untagged after 1 day.

---

## 8. Deployment Strategy

### Immutable Blue/Green via ECS

1. Build new Docker image → push to ECR with `sha-{commit}` tag
2. Update ECS task definition with new image tag
3. ECS performs rolling update: new tasks start → health check passes → old tasks drain
4. ALB drains connections from old tasks (30s deregistration delay)
5. Rollback: update task definition back to previous image tag

**Zero-downtime**: ALB health checks ensure no traffic hits unhealthy containers. Minimum healthy percent = 100% during deployment (no capacity reduction).

### Deployment Environments

| Env | Branch | Trigger | Approval |
|-----|--------|---------|---------|
| dev | `main` | Auto on push | None |
| staging | `release/*` | Auto on push | None |
| prod | `release/*` | Manual trigger | Alice approval |

---

## 9. Immediate Next Steps

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| 1 | Write `infrastructure/modules/networking/main.tf` | Quinn | planned |
| 2 | Write ECS + EFS Terraform modules | Quinn | planned |
| 3 | Write Dockerfile + ECR push pipeline | Quinn + Eve | planned |
| 4 | Set up CloudWatch dashboards for `/api/health` | Quinn + Liam | blocked (need SRE plan from Liam) |
| 5 | Heidi security review of SGs and IAM roles | Heidi | blocked (need Heidi) |
| 6 | RDS provisioning | Quinn + Pat | blocked (need Pat's schema) |

---

## 10. Open Questions / Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| File-based state not suited for multi-task ECS | Medium — two Fargate tasks writing the same files causes race conditions | Single-task for now; migrate to RDS when Pat's schema is ready |
| 20 Claude Code subprocesses per container — high CPU | Medium — may need larger Fargate task (2 vCPU) | Benchmark locally; adjust task CPU/memory accordingly |
| EFS latency vs local disk | Low — file ops are metadata heavy (small files) | EFS General Purpose mode handles <7K ops/sec; should be fine for 20 agents |
| No authentication on dashboard/API | High — open to internet without auth | Coordinate with Heidi; WAF + CloudFront geo-restriction short term |

---

*Last updated: 2026-03-29 by Quinn*
