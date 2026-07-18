resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.app_name}-api-keys"
  description = "API Keys for LLM routing and GitHub"
}

# The actual values should not be committed to Git.
# In a real environment, they would be populated via the AWS Console or CI/CD pipelines.
resource "aws_secretsmanager_secret_version" "api_keys_initial" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    omniroute = "INITIAL_PLACEHOLDER"
    github    = var.github_token
  })
}

