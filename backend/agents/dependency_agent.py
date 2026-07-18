import json, re, logging
from typing import Dict, Any, List
from agents.state import DiscoveryState
from services.llm_service import LLMService

logger = logging.getLogger("ADA.DependencyAgent")

def _parse_packages_static(high_value: Dict[str, str]) -> List[str]:
    packages = []
    for path, content in high_value.items():
        fname = path.split("/")[-1].lower()
        if fname.startswith("requirements") or fname == "requirements.txt":
            packages.extend([re.split(r"[>=<!\[;]", l)[0].strip() for l in content.splitlines() if l.strip() and not l.strip().startswith(("#", "-"))])
        elif fname == "pyproject.toml":
            in_deps = False
            for line in content.splitlines():
                stripped = line.strip()
                if any(x in stripped for x in ["[tool.poetry.dependencies]", "[project.dependencies]", "[dependencies]"]):
                    in_deps = True
                elif stripped.startswith("["):
                    in_deps = False
                elif in_deps and "=" in stripped and not stripped.startswith("#"):
                    pkg = stripped.split("=")[0].strip().strip('"\'')
                    if pkg.lower() != "python": packages.append(pkg)
        elif fname == "package.json":
            try:
                d = json.loads(content)
                packages.extend(list(d.get("dependencies", {}).keys()) + list(d.get("devDependencies", {}).keys()))
            except: pass
        elif fname == "go.mod":
            packages.extend([l.strip().split()[0] for l in content.splitlines() if l.strip() and " " in l.strip() and "/" in l.strip().split()[0] and not l.strip().startswith(("module", "go "))])
    return packages

def run_dependency_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info("Executing Dependency Discovery Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    high_value = state.get("high_value_contents", {})
    all_paths = list(state.get("repo_structure", {}).keys())

    focus = {p: c[:5000] for p, c in high_value.items() if p.split("/")[-1].lower() in {"requirements.txt", "pyproject.toml", "package.json", "go.mod", "cargo.toml"} or any(x in p.lower() for x in ["config", "settings", "model", "db", "database", "orm", "schema", "migration", "repository"])}
    if not focus: focus = {p: c[:3000] for p, c in high_value.items()}

    context = f"=== ALL REPOSITORY PATHS ===\n" + "\n".join(all_paths[:150]) + "\n\n" + "\n".join([f"=== {p} ===\n{c}" for p, c in focus.items()])

    sys_prompt = (
        "You are a dependency auditor and database architect. Analyze source code and manifests.\n"
        "1. Identify all third-party dependencies.\n"
        "2. Identify the database/ORM/persistence used in the repo.\n"
        "3. Write a database_summary paragraph.\n"
        "4. Design a persistence roadmap specific to this repo.\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"database_summary\": \"...\",\n"
        "  \"dependency_table\": [{\"package\": \"...\", \"scope\": \"...\", \"purpose\": \"...\"}],\n"
        "  \"persistence_roadmap\": [{\"layer\": \"...\", \"storage_data\": \"...\", \"engine\": \"...\", \"benefit\": \"...\"}],\n"
        "  \"internal_dependencies\": [], \"external_apis\": [], \"third_party_integrations\": []\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "database_summary": {"type": "string"},
            "dependency_table": {"type": "array", "items": {"type": "object", "properties": {"package": {"type": "string"}, "scope": {"type": "string"}, "purpose": {"type": "string"}}, "required": ["package", "scope", "purpose"]}},
            "persistence_roadmap": {"type": "array", "items": {"type": "object", "properties": {"layer": {"type": "string"}, "storage_data": {"type": "string"}, "engine": {"type": "string"}, "benefit": {"type": "string"}}, "required": ["layer", "storage_data", "engine", "benefit"]}},
            "internal_dependencies": {"type": "array", "items": {"type": "string"}},
            "external_apis": {"type": "array", "items": {"type": "string"}},
            "third_party_integrations": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["database_summary", "dependency_table", "persistence_roadmap", "internal_dependencies", "external_apis", "third_party_integrations"]
    }

    result = {"database_summary": "", "dependency_table": [], "persistence_roadmap": [], "internal_dependencies": [], "external_apis": [], "third_party_integrations": []}
    try:
        resp = llm.analyze(sys_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(resp["raw_output"])
        if isinstance(parsed, dict): result = parsed
    except Exception as e:
        logger.error(f"Dependency agent LLM analysis failed: {e}")

    dep_table = result.get("dependency_table") or []
    persistence = result.get("persistence_roadmap") or []
    int_deps = result.get("internal_dependencies") or []
    ext_apis = result.get("external_apis") or []
    ext_apis = [a if isinstance(a, str) else str(a) for a in ext_apis]
    third_party = result.get("third_party_integrations") or []
    third_party = [t if isinstance(t, str) else str(t) for t in third_party]

    # Static package supplementation
    seen_pkg = {d.get("package", "").lower() for d in dep_table if isinstance(d, dict)}
    scope_map = {
        "fastapi": ("Web Framework Core", "Powers HTTP endpoints and routing."),
        "openai": ("AI Models Interaction", "Interfaces with external LLM endpoints."),
        "httpx": ("HTTP Client Link", "Executes remote API service calls."),
        "pydantic": ("Data Validation", "Enforces runtime schemas and parameters."),
        "sqlalchemy": ("ORM / Database", "Manages structured data persistence."),
        "redis": ("Cache / Broker", "Provides caching layer.")
    }
    for pkg in _parse_packages_static(high_value):
        if pkg.lower() not in seen_pkg:
            scope, purpose = scope_map.get(pkg.lower(), ("Third-Party Library", "Provides functional extensions."))
            dep_table.append({"package": pkg, "scope": scope, "purpose": purpose})
            seen_pkg.add(pkg.lower())
            third_party.append(pkg)

    # Static URL extraction
    urls = re.findall(r'https?://([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', "\n".join(high_value.values()))
    for u in urls:
        if u and u not in {"localhost", "127.0.0.1", "0.0.0.0", "github.com", "raw.githubusercontent.com"} and u.lower() not in {a.lower() for a in ext_apis}:
            ext_apis.append(u)

    if not persistence:
        persistence = [
            {"layer": "Task & Report Cache", "storage_data": "User requests, parameters, report logs.", "engine": "PostgreSQL (RDS)", "benefit": "Provides structured transaction history."},
            {"layer": "Real-Time Event Broker", "storage_data": "Agent execution statuses, telemetry notifications.", "engine": "Redis", "benefit": "Manages horizontal task queue broker."},
            {"layer": "File Repository Store", "storage_data": "Generated reports (PDFs, DOCXs).", "engine": "Object Storage (S3)", "benefit": "Facilitates high-availability downloads."}
        ]

    if not int_deps and all_paths:
        dirs = sorted({p.split("/")[0] for p in all_paths if "/" in p})
        if len(dirs) >= 2: int_deps.append(f"Repository has {len(dirs)} top-level modules: {', '.join(dirs[:6])}.")

    return {
        "dependency_analysis": {
            "database_summary": result.get("database_summary") or "",
            "dependency_table": dep_table,
            "persistence_roadmap": persistence,
            "internal_dependencies": int_deps,
            "external_apis": ext_apis,
            "third_party_integrations": third_party
        }
    }
