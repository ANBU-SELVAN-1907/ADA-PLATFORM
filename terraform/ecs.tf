resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
}

resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 14
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.app_name}-ecs-task-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Attach permission to read secrets from AWS Secrets Manager
resource "aws_iam_policy" "secrets_access" {
  name = "${var.app_name}-secrets-access"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.api_keys.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "secrets_access_attachment" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 3072  # Increased: 10 LLM agents need more headroom
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  # Single Task with 2 containers: Frontend (Nginx) + Backend (FastAPI) sidecar
  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${var.ecr_repo_url}/ada/backend:latest"
      essential = true
      portMappings = [{ containerPort = 8000, hostPort = 8000, protocol = "tcp" }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
      secrets = [
        { name = "ADA_OMNIROUTE_API_KEY", valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:omniroute::" },
        { name = "ADA_GITHUB_TOKEN",      valueFrom = "${aws_secretsmanager_secret.api_keys.arn}:github::" }
      ]
      environment = [
        # CORS: Allow the ALB's DNS name as a trusted origin
        { name = "FRONTEND_URL",              value = "http://${aws_lb.main.dns_name}" },
        { name = "ADA_LLM_MAX_TOKENS",        value = "8000" },
        { name = "ADA_AGENT_TIMEOUT_SEC",     value = "120" },
        { name = "ADA_MAX_CONCURRENT_AGENTS", value = "6" },
        { name = "ADA_LLM_TEMPERATURE",       value = "0.2" },
        { name = "AWS_S3_BUCKET",             value = aws_s3_bucket.report_bucket.id },
        { name = "AWS_REGION",                value = var.aws_region }
      ]
      # Backend health check using native python urllib to avoid missing curl package issues in slim images
      healthCheck = {
        command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')\" || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 30
      }
    },
    {
      name      = "frontend"
      image     = "${var.ecr_repo_url}/ada/frontend:latest"
      essential = true
      portMappings = [{ containerPort = 80, hostPort = 80, protocol = "tcp" }]
      dependsOn = [{ containerName = "backend", condition = "HEALTHY" }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])
}

resource "aws_security_group" "ecs_sg" {
  name        = "${var.app_name}-ecs-sg"
  description = "Allow inbound from ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_service" "app_service" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  # Grace period allows backend+frontend to fully start before ALB checks health
  health_check_grace_period_seconds = 120

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  # Avoid service re-deployment just because task definition changed during Terraform apply
  lifecycle {
    ignore_changes = [task_definition]
  }
}

# ─── Reports S3 Bucket ──────────────────────────────────────────────────────────
resource "aws_s3_bucket" "report_bucket" {
  bucket_prefix = "${var.app_name}-reports-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "report_bucket_acl" {
  bucket                  = aws_s3_bucket.report_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─── ECS Task Role for Container Access (S3 uploads) ──────────────────────────
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "s3_access" {
  name = "${var.app_name}-s3-access"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.report_bucket.arn,
        "${aws_s3_bucket.report_bucket.arn}/*"
      ]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_access_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}
