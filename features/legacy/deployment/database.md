# Deployment — Database (RDS PostgreSQL)

## Overview

This sets up:
- A **VPC** with public and private subnets (shared with the backend)
- **RDS PostgreSQL** in a private subnet (not reachable from the internet)
- **Security groups** so only the ECS Fargate tasks can reach the database

The VPC is created here because the database and backend share it. The backend guide (`backend.md`) will reference the outputs from this file.

---

## 1. VPC — `vpc.tf`

The VPC has two public subnets (for the ALB and Fargate tasks) and two private subnets (for RDS). Two subnets per tier are required because AWS requires at least two availability zones for RDS.

```hcl
# vpc.tf

# The VPC — your private network in AWS
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true   # required for RDS hostname resolution

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# Internet Gateway — allows resources in public subnets to reach the internet
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

# Public subnet A (ALB + Fargate tasks)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-a"
  }
}

# Public subnet B (ALB requires 2 AZs)
resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-b"
  }
}

# Private subnet A (RDS)
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.app_name}-private-a"
  }
}

# Private subnet B (RDS requires 2 AZs)
resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.app_name}-private-b"
  }
}

# Route table for public subnets — routes internet traffic via the IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}
```

---

## 2. Security groups — `rds.tf` (part 1)

Security groups act as firewalls. The RDS security group only allows inbound traffic on port 5432 from the Fargate security group.

We define the Fargate security group here too (even though Fargate is set up later) so both can reference each other.

```hcl
# rds.tf

# Security group for Fargate tasks
# (defined here so RDS SG can reference it; used in ecs.tf)
resource "aws_security_group" "fargate" {
  name        = "${var.app_name}-fargate-sg"
  description = "Allow outbound traffic from Fargate tasks"
  vpc_id      = aws_vpc.main.id

  # Allow all outbound (needed to call external APIs like Resend, and to reach RDS)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-fargate-sg"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Allow PostgreSQL access from Fargate only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from Fargate"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.fargate.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
}
```

---

## 3. RDS instance — `rds.tf` (part 2)

```hcl
# RDS requires a subnet group spanning at least 2 AZs
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

# Store DB password in Secrets Manager
# (the actual password comes from terraform.tfvars)
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.app_name}/db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

# RDS PostgreSQL instance
resource "aws_db_instance" "main" {
  identifier        = "${var.app_name}-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "kino"
  username = "kino"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible = false   # private — not reachable from internet
  skip_final_snapshot = false   # create a snapshot before destroying
  deletion_protection = true    # prevent accidental deletion

  # Automated backups
  backup_retention_period = 7        # keep 7 days of automated backups
  backup_window           = "03:00-04:00"    # UTC
  maintenance_window      = "Mon:04:00-Mon:05:00"

  tags = {
    Name = "${var.app_name}-db"
  }
}
```

---

## 4. Outputs — `outputs.tf`

These values are needed by the backend setup:

```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_subnet_ids" {
  value = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "fargate_security_group_id" {
  value = aws_security_group.fargate.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
  # Format: kino-db.xxxx.eu-west-1.rds.amazonaws.com:5432
}

output "db_secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}
```

---

## 5. Apply

```bash
cd infrastructure/

terraform init
terraform plan    # review — should show VPC, subnets, RDS, security groups
terraform apply   # type 'yes' to confirm
```

This takes **5–10 minutes** — RDS provisioning is the slow part.

---

## 6. Run database migrations

Once RDS is running you need to run your SQL migrations. Because RDS is in a private subnet, you cannot connect directly from your laptop. Options:

### Option A — temporary Bastion (simplest for one-off migrations)

Spin up a small EC2 instance in the public subnet temporarily, SSH in, run psql, then terminate it.

```bash
# Launch a t3.nano Amazon Linux instance in your public subnet
# (do this in the AWS console — EC2 → Launch Instance)
# Allow SSH (port 22) from your IP in its security group
# Also allow outbound to RDS security group on port 5432

# SSH in
ssh -i your-key.pem ec2-user@<ec2-public-ip>

# Install psql
sudo yum install postgresql15 -y

# Connect to RDS
psql "postgresql://kino:<password>@<rds-endpoint>:5432/kino"

# Run migrations
\i /path/to/migrations/001_initial.sql
```

### Option B — run migrations from ECS (recommended for regular use)

Add a one-off ECS task in your GitHub Actions pipeline that runs migrations before deploying the new app version:

```bash
aws ecs run-task \
  --cluster kino-cluster \
  --task-definition kino-migrations \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --profile kino
```

This is set up in `backend.md`.

---

## 7. Connecting from your laptop (optional, for debugging)

If you want to run `psql` from your laptop against the production DB during debugging, use **AWS Systems Manager Session Manager** — it creates a tunnel without opening any ports or managing SSH keys.

```bash
# Install the SSM plugin
brew install --cask session-manager-plugin

# Start a port-forwarding session to RDS via an EC2 instance
aws ssm start-session \
  --target <ec2-instance-id> \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["<rds-endpoint>"],"portNumber":["5432"],"localPortNumber":["5433"]}' \
  --profile kino

# In another terminal, connect via the local port
psql "postgresql://kino:<password>@localhost:5433/kino"
```
