import re, logging
from typing import Dict, Any, List
from agents.state import DiscoveryState
from services.llm_service import LLMService

logger = logging.getLogger("ADA.DocAgent")

def _extract_docstrings(content: str, ext: str) -> str:
    lines = []
    if ext == "py":
        in_doc = False
        for line in content.splitlines():
            if '"""' in line or "'''" in line:
                in_doc = not in_doc
                lines.append(line)
            elif in_doc: lines.append(line)
    else:
        lines = [l for l in content.splitlines() if l.strip().startswith(("//", "*", "/*", "#"))]
    return "\n".join(lines[:60])

def _extract_api_routes(high_value: Dict[str, str]) -> List[Dict[str, str]]:
    routes, seen = [], set()
    py_pats = [re.compile(r'@(?:app|router)\.(get|post|put|delete)\(["\']([^"\']+)["\']')]
    js_pats = [re.compile(r'(?:app|router)\.(get|post|put|delete)\(["\']([^"\']+)["\']')]
    for path, content in high_value.items():
        ext = path.split(".")[-1].lower()
        pats = py_pats if ext == "py" else js_pats if ext in ["js", "ts"] else []
        for pat in pats:
            for m in pat.finditer(content):
                key = f"{m.group(1).upper()}:{m.group(2)}"
                if key not in seen:
                    routes.append({"endpoint": m.group(2), "method": m.group(1).upper(), "description": f"Detected in {path.split('/')[-1]}"})
                    seen.add(key)
    return routes[:25]

def _extract_env_vars(high_value: Dict[str, str]) -> List[Dict[str, Any]]:
    env_vars, seen = [], set()
    env_pat = re.compile(r'^([A-Z][A-Z0-9_]{2,})\s*=', re.MULTILINE)
    os_pat = re.compile(r'os\.(?:environ\.get|getenv)\(["\']([A-Z][A-Z0-9_]{2,})["\']')
    for path, content in high_value.items():
        fname = path.split("/")[-1].lower()
        if fname in [".env.example", ".env.sample"]:
            for m in env_pat.finditer(content):
                if m.group(1) not in seen:
                    env_vars.append({"key": m.group(1), "description": f"Configuration value for {m.group(1)}", "required": True})
                    seen.add(m.group(1))
        elif ".py" in path:
            for m in os_pat.finditer(content):
                if m.group(1) not in seen:
                    env_vars.append({"key": m.group(1), "description": f"Read in {path.split('/')[-1]}", "required": False})
                    seen.add(m.group(1))
    return env_vars[:20]

def run_doc_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info("Executing Documentation Discovery Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    high_value = state.get("high_value_contents", {})
    all_paths = list(state.get("repo_structure", {}).keys())

    doc_files = {p: c[:12000] for p, c in high_value.items() if p.lower().split("/")[-1].startswith("readme")}
    keywords = ["changelog", "contributing", "history", "release", "api", "docs/", "guide", "usage"]
    for p, c in high_value.items():
        if any(kw in p.lower() for kw in keywords) and p not in doc_files:
            doc_files[p] = c[:5000]

    source_docs = {}
    for p, c in high_value.items():
        if p not in doc_files and p.split(".")[-1].lower() in ["py", "js", "ts"]:
            docs = _extract_docstrings(c, p.split(".")[-1].lower())
            if len(docs) > 100: source_docs[p] = docs[:1500]

    context = f"=== ALL FILE PATHS ===\n" + "\n".join(all_paths[:200]) + "\n\n" + "\n\n".join(
        [f"=== {p} ===\n{c}" for p, c in doc_files.items()] + [f"=== {p} (docstrings) ===\n{c}" for p, c in list(source_docs.items())[:8]]
    )

    sys_prompt = (
        "You are a technical documentation analyst. Analyze provided documents and inline docstrings.\n"
        "Extract: purpose, setup instructions, APIs exposed, config settings, features, quality.\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"doc_summary\": \"...\", \"setup_instructions\": [],\n"
        "  \"api_documentation\": [{\"endpoint\": \"/api/route\", \"method\": \"GET\", \"description\": \"...\"}],\n"
        "  \"configuration_requirements\": [{\"key\": \"...\", \"description\": \"...\", \"required\": true}],\n"
        "  \"key_features\": [], \"changelog_highlights\": [], \"known_issues\": [], \"contribution_guidelines\": \"\",\n"
        "  \"documentation_quality\": \"...\"\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "doc_summary": {"type": "string"}, "setup_instructions": {"type": "array", "items": {"type": "string"}},
            "api_documentation": {"type": "array", "items": {"type": "object", "properties": {"endpoint": {"type": "string"}, "method": {"type": "string"}, "description": {"type": "string"}}, "required": ["endpoint", "method", "description"]}},
            "configuration_requirements": {"type": "array", "items": {"type": "object", "properties": {"key": {"type": "string"}, "description": {"type": "string"}, "required": {"type": "boolean"}}, "required": ["key", "description", "required"]}},
            "key_features": {"type": "array", "items": {"type": "string"}}, "changelog_highlights": {"type": "array", "items": {"type": "string"}},
            "known_issues": {"type": "array", "items": {"type": "string"}}, "contribution_guidelines": {"type": "string"}, "documentation_quality": {"type": "string"}
        },
        "required": ["doc_summary", "setup_instructions", "api_documentation", "configuration_requirements", "key_features", "documentation_quality"]
    }

    result = {"doc_summary": "", "setup_instructions": [], "api_documentation": [], "configuration_requirements": [], "key_features": [], "documentation_quality": "MINIMAL"}
    try:
        resp = llm.analyze(sys_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(resp["raw_output"])
        if isinstance(parsed, dict): result = parsed
    except Exception as e:
        logger.error(f"Documentation agent LLM analysis failed: {e}")

    if not result.get("api_documentation"): result["api_documentation"] = _extract_api_routes(high_value)
    if not result.get("configuration_requirements"): result["configuration_requirements"] = _extract_env_vars(high_value)

    return {"doc_analysis": result}
