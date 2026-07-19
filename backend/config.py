import os
from pathlib import Path

# Parse the local .env file (local dev only — in production env vars come from ECS task definition)
env_path = Path(".env")
if not env_path.exists() and Path("../.env").exists():
    env_path = Path("../.env")

if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            clean_line = line.strip()
            if clean_line and not clean_line.startswith("#") and "=" in clean_line:
                key, val = clean_line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# ─── Env-var alias mappings (NO hardcoded credentials — all secrets come from
#     environment variables: ECS Task Definition on AWS, or .env for local dev)

# Map ADA_OMNIROUTE_BASE_URL → ADA_OMNIROUTE_URL (append /chat/completions)
if "ADA_OMNIROUTE_BASE_URL" in os.environ and "ADA_OMNIROUTE_URL" not in os.environ:
    base_endpoint = os.environ["ADA_OMNIROUTE_BASE_URL"].rstrip("/")
    os.environ["ADA_OMNIROUTE_URL"] = f"{base_endpoint}/chat/completions"

# Map ADA_OMNIROUTE_API_KEY → ADA_OMNIROUTE_KEY
if "ADA_OMNIROUTE_API_KEY" in os.environ and "ADA_OMNIROUTE_KEY" not in os.environ:
    os.environ["ADA_OMNIROUTE_KEY"] = os.environ["ADA_OMNIROUTE_API_KEY"]

# Map ADA_OMNIROUTE_MODEL → ADA_PRIMARY_MODEL
if "ADA_OMNIROUTE_MODEL" in os.environ and "ADA_PRIMARY_MODEL" not in os.environ:
    os.environ["ADA_PRIMARY_MODEL"] = os.environ["ADA_OMNIROUTE_MODEL"]

# Map standard OpenAI env var name → ADA internal key
if "OPENAI_API_KEY" in os.environ and "ADA_OPENAI_KEY" not in os.environ:
    os.environ["ADA_OPENAI_KEY"] = os.environ["OPENAI_API_KEY"]

# Map standard Gemini env var name → ADA internal key
if "GEMINI_API_KEY" in os.environ and "ADA_GEMINI_KEY" not in os.environ:
    os.environ["ADA_GEMINI_KEY"] = os.environ["GEMINI_API_KEY"]


class Settings:
    APP_VERSION: str = "3.0.0"
    APP_TYPE: str = "Deep Schematic Discovery Engine"
    VERSION_COUNT: str = "ADA-V3"
    OUTPUT_DIR: Path = Path("output")
    # True when running on AWS ECS with Bedrock IAM role — no API keys needed
    USE_BEDROCK: bool = os.getenv("ADA_USE_BEDROCK", "false").lower() == "true"


settings = Settings()
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
