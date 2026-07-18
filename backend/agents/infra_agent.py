import logging
from typing import Dict, Any
from agents.state import DiscoveryState
from services.llm_service import LLMService

logger = logging.getLogger("ADA.InfraAgent")

def run_infra_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info("Executing Infrastructure & Deployment Discovery Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    high_value = state.get("high_value_contents", {})
    all_paths = list(state.get("repo_structure", {}).keys())

    context = f"=== ALL FILE PATHS ===\n" + "\n".join(all_paths[:200]) + "\n\n" + "\n\n".join(
        [f"=== {p} ===\n{c[:4000]}" for p, c in high_value.items()]
    )

    sys_prompt = (
        "You are a DevOps and cloud infrastructure architect. Analyze ALL repository files.\n"
        "1. Write infra_summary (2-3 sentences about actual deployment, container, CI/CD).\n"
        "2. Identify scaling properties, constraints, recommendations.\n"
        "3. Identify CI/CD pipelines, cloud services, Docker usage, deployment targets.\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"infra_summary\": \"...\",\n"
        "  \"scaling_configurations\": [{\"property\": \"...\", \"constraint\": \"...\", \"recommendation\": \"...\"}],\n"
        "  \"cloud_services\": [],\n"
        "  \"containerization\": {\"has_docker\": false, \"details\": \"...\"},\n"
        "  \"cicd_pipelines\": [],\n"
        "  \"deployment_targets\": []\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "infra_summary": {"type": "string"},
            "scaling_configurations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "property": {"type": "string"}, "constraint": {"type": "string"}, "recommendation": {"type": "string"}
                    },
                    "required": ["property", "constraint", "recommendation"]
                }
            },
            "cloud_services": {"type": "array", "items": {"type": "string"}},
            "containerization": {
                "type": "object",
                "properties": {"has_docker": {"type": "boolean"}, "details": {"type": "string"}},
                "required": ["has_docker", "details"]
            },
            "cicd_pipelines": {"type": "array", "items": {"type": "string"}},
            "deployment_targets": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["infra_summary", "scaling_configurations", "cloud_services", "containerization", "cicd_pipelines", "deployment_targets"]
    }

    result = {
        "infra_summary": "", "scaling_configurations": [], "cloud_services": [],
        "containerization": {"has_docker": False, "details": "Not detected."},
        "cicd_pipelines": [], "deployment_targets": []
    }
    try:
        resp = llm.analyze(sys_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(resp["raw_output"])
        if isinstance(parsed, dict):
            result = parsed
    except Exception as e:
        logger.error(f"Infra agent LLM analysis failed: {e}")

    scaling = result.get("scaling_configurations") or []
    container = result.get("containerization") or {"has_docker": False, "details": "Not detected."}
    cicd = result.get("cicd_pipelines") or []
    cicd = [c if isinstance(c, str) else str(c) for c in cicd]

    docker_files = [p for p in all_paths if "dockerfile" in p.lower() or "docker-compose" in p.lower()]
    if docker_files and not container.get("has_docker"):
        container["has_docker"] = True
        container["details"] = f"Docker files detected: {', '.join(docker_files[:5])}"

    existing_cicd = {c.lower() for c in cicd}
    for wf in [p for p in all_paths if ".github/workflows/" in p.lower() and (p.endswith(".yml") or p.endswith(".yaml"))]:
        entry = f"GitHub Actions: {wf.split('/')[-1]}"
        if entry.lower() not in existing_cicd:
            cicd.append(entry)
            existing_cicd.add(entry.lower())

    if not scaling:
        scaling = [
            {
                "property": "Deployment Configuration",
                "constraint": f"No infrastructure configuration files detected in {len(all_paths)} repository files.",
                "recommendation": "Add a Dockerfile and docker-compose.yml to containerize the application for consistent deployments."
            },
            {
                "property": "CI/CD Pipeline",
                "constraint": "No CI/CD pipeline configuration detected in the repository.",
                "recommendation": "Add GitHub Actions or GitLab CI workflows to automate testing and deployment."
            }
        ]

    return {
        "infrastructure_insights": {
            "infra_summary": result.get("infra_summary", ""),
            "scaling_configurations": scaling,
            "cloud_services": result.get("cloud_services") or [],
            "containerization": container,
            "cicd_pipelines": cicd,
            "deployment_targets": result.get("deployment_targets") or []
        }
    }
