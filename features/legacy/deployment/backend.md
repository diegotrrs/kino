# Deployment — Backend (ECS + Fargate)

## Overview

This sets up:
- **ECR** — container registry to store Docker images
- **ECS cluster + Fargate service** — runs the FastAPI container
- **Application Load Balancer** — public HTTPS endpoint for the backend API
- **IAM roles** — permissions for ECS tasks and GitHub Actions
- **Secrets Manager** — stores DB credentials and JWT secret
- **GitHub Actions pipeline** — builds image, pushes to ECR, deploys to ECS

Prerequisites: complete `database.md` first — this guide references the VPC, subnets, and security groups created there.

---

## 1. Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Test it locally before pushing:

```bash
cd backend/
docker build -t kino-backend .
docker run -p 8000:8000 --env-file .env kino-backend
```

---

## 2. ECR repository — `ecr.tf`

ECR is AWS's private Docker registry. Your GitHub Actions pipeline will push images here, and ECS will pull from here.

```hcl
# ecr.tf

resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true   # scans for known vulnerabilities on every push
  }

  tags = {
    Name = "${var.app_name}-backend"
  }
}

# Keep only the last 10 images to control storage costs
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
  # Format: <account-id>.dkr.ecr.eu-west-1.amazonaws.com/kino-backend
}
```

---

## 3. Secrets — `secrets.tf`

Store sensitive values in Secrets Manager so they never appear in your code or ECS task definition.

```hcl
# secrets.tf

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${var.app_name}/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "resend_api_key" {
  name = "${var.app_name}/resend-api-key"
}

resource "aws_secretsmanager_secret_version" "resend_api_key" {
  secret_id     = aws_secretsmanager_secret.resend_api_key.id
  secret_string = var.resend_api_key
}
```

Add to `variables.tf`:

```hcl
variable "jwt_secret" {
  description = "JWT signing secret"
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for emails"
  sensitive   = true
}
```

Add to `terraform.tfvars`:

```hcl
jwt_secret     = "your-jwt-secret"
resend_api_key = "re_xxxxxxxxxxxx"
```

---

## 4. IAM roles — `iam.tf`

ECS needs two IAM roles:

- **Execution role** — used by the ECS agent to pull the image from ECR and fetch secrets from Secrets Manager
- **Task role** — used by your application code at runtime (e.g. if it calls other AWS services)

```hcl
# iam.tf

# Execution role — used by ECS agent (not your app code)
resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow execution role to read secrets from Secrets Manager
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.db_password.arn,
        aws_secretsmanager_secret.jwt_secret.arn,
        aws_secretsmanager_secret.resend_api_key.arn,
      ]
    }]
  })
}

# Task role — used by your app code at runtime
resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# GitHub Actions role (OIDC — no static AWS credentials needed)
data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint (stable, does not change often)
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "${var.app_name}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          # Replace with your GitHub org/repo
          "token.actions.githubusercontent.com:sub" = "repo:YOUR_GITHUB_USERNAME/kino:*"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions_policy" {
  name = "github-actions-deploy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn,
        ]
      }
    ]
  })
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}
```

---

## 5. ECS cluster + task definition — `ecs.tf`

```hcl
# ecs.tf

# CloudWatch log group for backend logs
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.app_name}-backend"
  retention_in_days = 30
}

# ECS cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
}

# Task definition — describes the container(s) to run
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256   # 0.25 vCPU
  memory                   = 512   # 0.5 GB

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "backend"
    image = "${aws_ecr_repository.backend.repository_url}:latest"

    portMappings = [{
      containerPort = 8000
      protocol      = "tcp"
    }]

    # Inject secrets as environment variables
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "${aws_secretsmanager_secret.db_password.arn}"
      },
      {
        name      = "JWT_SECRET"
        valueFrom = "${aws_secretsmanager_secret.jwt_secret.arn}"
      },
      {
        name      = "RESEND_API_KEY"
        valueFrom = "${aws_secretsmanager_secret.resend_api_key.arn}"
      },
    ]

    environment = [
      { name = "ENVIRONMENT", value = "production" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.backend.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ECS service — keeps the desired number of tasks running
resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.fargate.id]
    assign_public_ip = true   # needed to pull ECR images without NAT Gateway
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  # Wait for ALB to be ready before creating the service
  depends_on = [aws_lb_listener.https]

  # Allow Terraform to update the service without destroying it
  lifecycle {
    ignore_changes = [task_definition]   # GitHub Actions manages this
  }
}
```

---

## 6. Application Load Balancer — `alb.tf`

```hcl
# alb.tf

# Security group for the ALB — accepts HTTPS from anywhere
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Allow HTTPS inbound"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

# Allow ALB to send traffic to Fargate tasks
resource "aws_security_group_rule" "fargate_from_alb" {
  type                     = "ingress"
  from_port                = 8000
  to_port                  = 8000
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.fargate.id
}

# The ALB itself
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "${var.app_name}-alb"
  }
}

# Target group — where the ALB forwards requests to
resource "aws_lb_target_group" "backend" {
  name        = "${var.app_name}-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"   # required for Fargate

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# HTTP listener — redirects to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS listener — forwards to target group
# Requires an ACM certificate (see step 7)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.api.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}
```

---

## 7. TLS certificate (ACM)

AWS Certificate Manager (ACM) provides free TLS certificates. You need a domain for this.

```hcl
# Add to alb.tf

variable "api_domain" {
  description = "Domain for the backend API e.g. api.yourdomain.com"
}

resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Output the DNS validation record — you add this to your domain's DNS
output "acm_validation_record" {
  value = aws_acm_certificate.api.domain_validation_options
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn = aws_acm_certificate.api.arn
  # After applying, add the DNS record shown in acm_validation_record output
  # to your domain registrar, then run terraform apply again
}
```

Add to `terraform.tfvars`:

```hcl
api_domain = "api.yourdomain.com"
```

---

## 8. Add a health check endpoint to FastAPI

The ALB health check hits `/health`. Add this to your FastAPI app if it doesn't exist:

```python
# backend/app/main.py
@app.get("/health")
def health():
    return {"status": "ok"}
```

---

## 9. Apply

```bash
cd infrastructure/
terraform plan
terraform apply
```

After apply:
1. Note the `acm_validation_record` output
2. Add the DNS CNAME record to your domain registrar
3. Wait ~5 minutes for DNS validation
4. Run `terraform apply` again — the certificate will now validate and the HTTPS listener will be created

---

## 10. GitHub Actions pipeline

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

env:
  AWS_REGION:     eu-west-1
  ECR_REPOSITORY: kino-backend
  ECS_CLUSTER:    kino-cluster
  ECS_SERVICE:    kino-backend

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      id-token: write   # required for OIDC authentication to AWS
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC — no static keys)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        id: build
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          # Also tag as latest
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
                     $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS service with new image
        env:
          IMAGE: ${{ steps.build.outputs.image }}
        run: |
          # Get current task definition
          TASK_DEF=$(aws ecs describe-task-definition \
            --task-definition kino-backend \
            --query taskDefinition)

          # Update the image in the task definition
          NEW_TASK_DEF=$(echo $TASK_DEF | jq \
            --arg IMAGE "$IMAGE" \
            '.containerDefinitions[0].image = $IMAGE |
             del(.taskDefinitionArn, .revision, .status,
                 .requiresAttributes, .compatibilities,
                 .registeredAt, .registeredBy)')

          # Register new task definition revision
          NEW_REVISION=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          # Update ECS service to use new revision
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --task-definition $NEW_REVISION

          # Wait for deployment to complete
          aws ecs wait services-stable \
            --cluster $ECS_CLUSTER \
            --services $ECS_SERVICE
```

### Add secrets to GitHub

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `AWS_ROLE_ARN` | The `github_actions_role_arn` output from Terraform |

---

## 11. Push your first image manually

Before the GitHub Actions pipeline runs for the first time, push an initial image so ECS has something to pull:

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region eu-west-1 --profile kino | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.eu-west-1.amazonaws.com

# Build and push
cd backend/
docker build -t kino-backend .
docker tag kino-backend:latest \
  <account-id>.dkr.ecr.eu-west-1.amazonaws.com/kino-backend:latest
docker push \
  <account-id>.dkr.ecr.eu-west-1.amazonaws.com/kino-backend:latest
```

Replace `<account-id>` with your AWS account ID (visible in the `ecr_repository_url` Terraform output).
