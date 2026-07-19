resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.app_name}-api-keys"
  description = "API Keys for LLM providers (Omniroute, OpenAI, Gemini) and GitHub"
}

# Initial secret structure — actual values should be set via AWS Console or CI/CD.
# Keys stored here: omniroute, github, openai, gemini
resource "aws_secretsmanager_secret_version" "api_keys_initial" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    omniroute = "PLACEHOLDER"
    github    = var.github_token
    openai    = "PLACEHOLDER"
    gemini    = "PLACEHOLDER"
  })

  # Prevent Terraform from overwriting the secret values after the initial creation.
  # Real values are updated via AWS Console / CI pipeline, not in code.
  lifecycle {
    ignore_changes = [secret_string]
  }
}
