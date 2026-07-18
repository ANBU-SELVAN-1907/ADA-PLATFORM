import os
from pathlib import Path

# Parse the local .env configuration line by line manually to preserve zero-dependency design
env_path = Path(".env")
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            clean_line = line.strip()
            if clean_line and not clean_line.startswith("#") and "=" in clean_line:
                key, val = clean_line.split("=", 1)
                os.environ[key.strip()] = val.strip()

# Map your specific environment keys directly into the engine's internal framework structure
if "ADA_OMNIROUTE_BASE_URL" in os.environ and "ADA_OMNIROUTE_URL" not in os.environ:
    # Append the direct chat endpoint context route to the base local address path
    base_endpoint = os.environ["ADA_OMNIROUTE_BASE_URL"].rstrip("/")
    os.environ["ADA_OMNIROUTE_URL"] = f"{base_endpoint}/chat/completions"

if "ADA_OMNIROUTE_API_KEY" in os.environ and "ADA_OMNIROUTE_KEY" not in os.environ:
    os.environ["ADA_OMNIROUTE_KEY"] = os.environ["ADA_OMNIROUTE_API_KEY"]

if "ADA_OMNIROUTE_MODEL" in os.environ and "ADA_PRIMARY_MODEL" not in os.environ:
    os.environ["ADA_PRIMARY_MODEL"] = os.environ["ADA_OMNIROUTE_MODEL"]

class Settings:
    APP_VERSION: str = "1.0.0"
    APP_TYPE: str = "Deep Schematic Discovery Engine"
    VERSION_COUNT: str = "ADA-V2"
    OUTPUT_DIR: Path = Path("output")

settings = Settings()
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
