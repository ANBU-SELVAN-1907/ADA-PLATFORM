import re, logging
from typing import Dict, Any
from agents.state import DiscoveryState
from services.llm_service import LLMService

logger = logging.getLogger("ADA.SecurityAgent")

def _safe_str(item) -> str:
    if isinstance(item, str): return item
    if isinstance(item, dict):
        for k in ("name", "framework", "library", "mechanism", "value", "label"):
            if k in item and isinstance(item[k], str): return item[k]
        for v in item.values():
            if isinstance(v, str): return v
    return str(item)

def run_security_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info("Executing Security & Observability Audit Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    high_value = state.get("high_value_contents", {})
    all_paths = list(state.get("repo_structure", {}).keys())

    context = f"=== ALL FILE PATHS ===\n" + "\n".join(all_paths[:150]) + "\n\n" + "\n\n".join(
        [f"=== {p} ===\n{c[:5000]}" for p, c in high_value.items()]
    )

    sys_prompt = (
        "You are a senior security and observability auditor. Scan ALL repository files.\n"
        "1. Write security_summary (2-3 sentences about auth, secrets, risks).\n"
        "2. Identify security_risks (hardcoded keys, CORS, SQLi).\n"
        "3. Identify logging_frameworks and auth_mechanisms.\n"
        "4. Write observability_posture paragraph describing actual logging/metrics.\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"security_summary\": \"...\",\n"
        "  \"security_risks\": [{\"risk_id\": \"SEC-01\", \"severity\": \"HIGH\", \"detail\": \"...\", \"target\": \"...\", \"mitigation\": \"...\"}],\n"
        "  \"observability_posture\": \"...\",\n"
        "  \"logging_frameworks\": [], \"auth_mechanisms\": []\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "security_summary": {"type": "string"},
            "security_risks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "risk_id": {"type": "string"}, "severity": {"type": "string"},
                        "detail": {"type": "string"}, "target": {"type": "string"}, "mitigation": {"type": "string"}
                    },
                    "required": ["risk_id", "severity", "detail", "target", "mitigation"]
                }
            },
            "observability_posture": {"type": "string"},
            "logging_frameworks": {"type": "array", "items": {"type": "string"}},
            "auth_mechanisms": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["security_summary", "security_risks", "observability_posture", "logging_frameworks", "auth_mechanisms"]
    }

    result = {"security_summary": "", "security_risks": [], "observability_posture": "", "logging_frameworks": [], "auth_mechanisms": []}
    try:
        resp = llm.analyze(sys_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(resp["raw_output"])
        if isinstance(parsed, dict): result = parsed
    except Exception as e:
        logger.error(f"Security agent LLM analysis failed: {e}")

    logging_frameworks = [_safe_str(x) for x in (result.get("logging_frameworks") or [])]
    auth_mechs = [_safe_str(x) for x in (result.get("auth_mechanisms") or [])]
    security_risks = result.get("security_risks") or []
    obs_posture = result.get("observability_posture") or ""

    # Heuristics scan
    found_log = []
    log_sigs = {"import logging": "Python standard logging", "from logging": "Python standard logging", "winston": "Winston (Node.js)", "sentry_sdk": "Sentry SDK", "datadog": "DataDog", "opentelemetry": "OpenTelemetry"}
    auth_sigs = {"bearer": "Bearer Token Authentication", "jwt": "JWT (JSON Web Tokens)", "oauth": "OAuth2", "api_key": "API Key Authentication"}
    
    for path, content in high_value.items():
        content_lower = content.lower()
        for sig, lbl in log_sigs.items():
            if sig in content_lower and lbl not in found_log:
                found_log.append(lbl)
                if lbl not in logging_frameworks: logging_frameworks.append(lbl)
        for sig, lbl in auth_sigs.items():
            if sig in content_lower and lbl.lower() not in {a.lower() for a in auth_mechs}:
                auth_mechs.append(lbl)

    if not obs_posture:
        if found_log:
            obs_posture = f"The repository utilizes {', '.join(found_log)} for logging. Centralized logging or metrics exporters are absent."
        else:
            obs_posture = "No dedicated logging framework imports detected. The app may use stdout. Production deployment requires structured logging."

    # Vulnerability Heuristics
    risk_counter = len(security_risks) + 1
    existing_details = {r.get("detail", "").lower() for r in security_risks if isinstance(r, dict)}
    for path, content in high_value.items():
        match = re.search(r'(?i)(api_key|secret|password|token)\s*=\s*["\']([a-zA-Z0-9\-_]{16,})["\']', content)
        if match and "hardcoded api key" not in existing_details:
            security_risks.append({
                "risk_id": f"SEC-0{risk_counter:02d}", "severity": "CRITICAL",
                "detail": "Hardcoded API key or private secret credential leaked in code.",
                "target": f"{path} — {match.group(1)}",
                "mitigation": "Remove hardcoded credentials; reference environment variables."
            })
            risk_counter += 1
        if ('allow_origins=["*"]' in content.replace(" ", "") or "allow_origins=['*']" in content.replace(" ", "")) and "permissive cors" not in existing_details:
            security_risks.append({
                "risk_id": f"SEC-0{risk_counter:02d}", "severity": "MEDIUM",
                "detail": "Permissive Cross-Origin Resource Sharing (CORS) wildcard configurations.",
                "target": f"{path} — allow_origins=['*']",
                "mitigation": "Restrict CORS to explicitly whitelisted domain origins only."
            })
            risk_counter += 1

    return {
        "security_observability": {
            "security_summary": result.get("security_summary", ""),
            "security_risks": security_risks,
            "observability_posture": obs_posture,
            "logging_frameworks": logging_frameworks,
            "auth_mechanisms": auth_mechs,
            "vulnerabilities": security_risks
        }
    }
