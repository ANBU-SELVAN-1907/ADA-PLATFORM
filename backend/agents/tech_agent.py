import os, logging
from typing import Dict, Any
from agents.state import DiscoveryState
from services.llm_service import LLMService

logger = logging.getLogger("ADA.TechAgent")

def run_tech_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info("Executing Technology Stack Discovery Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    high_value = state.get("high_value_contents", {})
    all_paths = list(state.get("repo_structure", {}).keys())

    context = f"=== REPOSITORY FILE PATHS ===\n" + "\n".join(all_paths[:200]) + "\n\n" + "\n\n".join(
        [f"=== {p} ===\n{c[:4000]}" for p, c in high_value.items()]
    )

    sys_prompt = (
        "You are a technology stack auditor. Identify every language, framework, build tool, database, and library used.\n"
        "Also write a stack_summary (1-2 sentences describing the tech stack).\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"stack_summary\": \"1-2 sentences description.\",\n"
        "  \"tech_stack_table\": [{\"layer\": \"...\", \"technology\": \"...\", \"version\": \"...\", \"usage\": \"...\"}]\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "stack_summary": {"type": "string"},
            "tech_stack_table": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "layer": {"type": "string"}, "technology": {"type": "string"},
                        "version": {"type": "string"}, "usage": {"type": "string"}
                    },
                    "required": ["layer", "technology", "version", "usage"]
                }
            }
        },
        "required": ["stack_summary", "tech_stack_table"]
    }

    result = {"stack_summary": "", "tech_stack_table": []}
    try:
        resp = llm.analyze(sys_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(resp["raw_output"])
        if isinstance(parsed, dict):
            result = parsed
    except Exception as e:
        logger.error(f"Tech agent LLM analysis failed: {e}")

    tech_table = result.get("tech_stack_table", [])
    stack_summary = result.get("stack_summary", "")
    if not isinstance(tech_table, list):
        tech_table = []

    ext_map = {
        ".py":   ("Primary Runtime",        "Python",     "v3.8+",        "Backend engine, logic, and scripting."),
        ".js":   ("Client-Side Scripting",  "JavaScript", "ECMAScript 6+","DOM manipulation, event handling, async."),
        ".ts":   ("Frontend Framework",     "TypeScript", "Modern spec",  "Typed frontend logic and interfaces."),
        ".go":   ("Primary Runtime",        "Go",         "Go 1.20+",     "High-performance concurrent services."),
        ".rs":   ("Primary Runtime",        "Rust",       "Cargo system", "System-level tooling and performance."),
        ".rb":   ("Primary Runtime",        "Ruby",       "Ruby 3+",      "Server-side scripting and web apps."),
        ".java": ("Primary Runtime",        "Java",       "JDK 17+",      "Enterprise backend services."),
        ".cs":   ("Primary Runtime",        "C#/.NET",    ".NET 7+",      "Cross-platform application logic."),
        ".php":  ("Primary Runtime",        "PHP",        "PHP 8+",       "Web server scripting."),
        ".kt":   ("Primary Runtime",        "Kotlin",     "Kotlin 1.8+",  "Android or JVM backend services."),
        ".swift":("Primary Runtime",        "Swift",      "Swift 5+",     "iOS/macOS native applications."),
    }

    tool_map = {
        "requirements.txt":  ("Package Manager", "pip",       "latest", "Python package installation and environment management."),
        "package.json":      ("Package Manager", "npm",       "latest", "Node.js dependency and script management."),
        "cargo.toml":        ("Build Tool",      "Cargo",     "latest", "Rust package management and compilation."),
        "go.mod":            ("Build Tool",      "Go Modules","latest", "Go dependency management."),
        "pom.xml":           ("Build Tool",      "Maven",     "latest", "Java project build and dependency management."),
        "build.gradle":      ("Build Tool",      "Gradle",    "latest", "JVM project build automation."),
        "makefile":          ("Build Tool",      "Make",      "GNU",    "Build automation via shell recipes."),
        "dockerfile":        ("Containerization","Docker",    "latest", "Container image build definition."),
        "docker-compose.yml":("Orchestration",   "Docker Compose","latest","Multi-container service orchestration."),
    }

    seen = {t.get("technology", "").lower() for t in tech_table if isinstance(t, dict)}
    for path in all_paths:
        ext = os.path.splitext(path)[1].lower()
        fname = os.path.basename(path).lower()
        
        target = ext_map.get(ext) or tool_map.get(fname)
        if target:
            layer, tech, ver, usage = target
            if tech.lower() not in seen:
                tech_table.append({"layer": layer, "technology": tech, "version": ver, "usage": usage})
                seen.add(tech.lower())

    legacy_langs = [
        {"name": r["technology"], "confidence": 1.0, "evidence": r["usage"], "reasoning": "Detected via file extension"}
        for r in tech_table if "runtime" in r.get("layer", "").lower() or "language" in r.get("layer", "").lower()
    ]
    legacy_fws = [
        {"name": r["technology"], "purpose": r["layer"], "confidence": 1.0, "evidence": r["usage"], "reasoning": "Detected via manifest"}
        for r in tech_table if not ("runtime" in r.get("layer", "").lower() or "language" in r.get("layer", "").lower())
    ]

    return {
        "technology_stack": {
            "stack_summary": stack_summary,
            "tech_stack_table": tech_table,
            "languages": legacy_langs,
            "frameworks": legacy_fws,
            "build_tools": list(seen)
        }
    }
