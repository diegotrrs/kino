# Deployment — General Setup

## Stack overview

| Layer | Provider | How |
|---|---|---|
| Frontend | Vercel | Git-based deploy, automatic on push |
| Backend | AWS ECS + Fargate | Docker container, deployed via GitHub Actions |
| Database | AWS RDS PostgreSQL | Managed, in private VPC subnet |
| Infrastructure | Terraform | All AWS resources defined as code |
| CI/CD | GitHub Actions | Build, test, push, deploy |

## Architecture

```
Internet
    │
    ├── Vercel (Next.js)
    │       │ API calls (HTTPS)
    │       ▼
    │   Application Load Balancer  ← public subnet
    │       │
    │       ▼
    │   ECS Fargate (FastAPI)      ← public subnet (SG restricts to ALB only)
    │       │
    │       ▼
    │   RDS PostgreSQL             ← private subnet (SG restricts to Fargate only)
    │
    └── GitHub Actions (CI/CD)
            │ push image to ECR
            │ trigger ECS deployment
```

---

## 1. Tools to install

### AWS CLI

```bash
# macOS (Homebrew)
brew install awscli

# Verify
aws --version
```

### Terraform

```bash
# macOS (Homebrew)
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify
terraform --version
```

### Docker

Required to build and push container images.

```bash
# macOS — install Docker Desktop from https://www.docker.com/products/docker-desktop
# Verify
docker --version
```

---

## 2. AWS account setup

### Create an AWS account

Go to https://aws.amazon.com and create an account if you don't have one.

### Create an IAM user for Terraform

Never use your root account credentials for day-to-day work.

1. Go to **IAM → Users → Create user**
2. Name it `kino-terraform`
3. Attach the policy **AdministratorAccess** (you can restrict this later once you know exactly what resources you need)
4. Go to the user → **Security credentials → Create access key**
5. Choose **CLI** as the use case
6. Save the **Access Key ID** and **Secret Access Key** — you will not see the secret again

### Configure AWS CLI

```bash
aws configure --profile kino

# You will be prompted for:
AWS Access Key ID:     <your access key>
AWS Secret Access Key: <your secret key>
Default region name:   eu-west-1       # Ireland — good for Europe
Default output format: json
```

Verify it works:

```bash
aws sts get-caller-identity --profile kino
# Should return your account ID and user ARN
```

---

## 3. Terraform project structure

Create an `infrastructure/` directory at the root of the kino repo:

```
kino/
└── infrastructure/
    ├── main.tf           # provider config, backend config
    ├── variables.tf      # input variables
    ├── outputs.tf        # outputs (URLs, ARNs, etc.)
    ├── terraform.tfvars  # variable values (not committed to git)
    ├── vpc.tf            # VPC, subnets, internet gateway
    ├── rds.tf            # RDS PostgreSQL
    ├── ecr.tf            # ECR repository
    ├── ecs.tf            # ECS cluster, task definition, service
    ├── alb.tf            # Application Load Balancer
    ├── iam.tf            # IAM roles for ECS tasks and GitHub Actions
    └── secrets.tf        # AWS Secrets Manager entries
```

### main.tf — provider and backend

```hcl
terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Store Terraform state in S3 so it is shared and not just on your laptop.
  # Create the S3 bucket manually first (see step 4 below).
  backend "s3" {
    bucket  = "kino-terraform-state"
    key     = "production/terraform.tfstate"
    region  = "eu-west-1"
    profile = "kino"
  }
}

provider "aws" {
  region  = var.aws_region
  profile = "kino"
}
```

### variables.tf

```hcl
variable "aws_region" {
  default = "eu-west-1"
}

variable "app_name" {
  default = "kino"
}

variable "environment" {
  default = "production"
}

variable "db_password" {
  description = "RDS master password"
  sensitive   = true
}
```

### terraform.tfvars (add to .gitignore)

```hcl
db_password = "your-strong-password-here"
```

Add to `.gitignore`:

```
infrastructure/terraform.tfvars
infrastructure/.terraform/
infrastructure/*.tfstate
infrastructure/*.tfstate.backup
```

---

## 4. Terraform state bucket

Terraform needs somewhere to store its state file — a record of what it has created. S3 is the standard choice.

Create the bucket manually (just once, before running `terraform init`):

```bash
aws s3api create-bucket \
  --bucket kino-terraform-state \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1 \
  --profile kino

# Enable versioning so you can recover previous states
aws s3api put-bucket-versioning \
  --bucket kino-terraform-state \
  --versioning-configuration Status=Enabled \
  --profile kino

# Block all public access
aws s3api put-public-access-block \
  --bucket kino-terraform-state \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
  --profile kino
```

---

## 5. Terraform workflow

You will use these commands throughout the setup:

```bash
cd infrastructure/

# Download providers and initialise backend
terraform init

# Preview what will be created/changed/destroyed — always run this first
terraform plan

# Apply the changes
terraform apply

# Destroy everything (careful — use only to tear down)
terraform destroy
```

Terraform is **declarative** — you describe the desired state, it figures out what to create, change, or delete to get there. Running `terraform apply` twice is safe — the second run does nothing if nothing changed.

---

## 6. Order of operations

Follow the guides in this order — each step depends on the previous:

1. **`database.md`** — VPC + RDS (the backend needs to know the DB endpoint)
2. **`backend.md`** — ECR + ECS + ALB (the frontend needs to know the backend URL)
3. **`frontend.md`** — Vercel (needs the backend API URL as an env var)

---

## 7. Useful AWS CLI commands

```bash
# List ECS clusters
aws ecs list-clusters --profile kino

# List running ECS tasks
aws ecs list-tasks --cluster kino-cluster --profile kino

# Describe a task (see logs, IP, status)
aws ecs describe-tasks \
  --cluster kino-cluster \
  --tasks <task-arn> \
  --profile kino

# Get RDS instance details
aws rds describe-db-instances \
  --db-instance-identifier kino-db \
  --profile kino

# Force a new ECS deployment (useful after pushing a new image)
aws ecs update-service \
  --cluster kino-cluster \
  --service kino-backend \
  --force-new-deployment \
  --profile kino
```
