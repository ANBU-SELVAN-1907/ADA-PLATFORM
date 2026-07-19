import logging
import json
from langgraph.graph import StateGraph, END

from agents.state import DiscoveryState
from agents.repo_agent import run_repo_agent
from agents.tech_agent import run_tech_agent
from agents.dependency_agent import run_dependency_agent
from agents.infra_agent import run_infra_agent
from agents.security_agent import run_security_agent
from agents.doc_agent import run_doc_agent
from agents.report_agent import run_report_agent
from services.llm_service import LLMService

logger = logging.getLogger("ADA.Orchestration")


def run_architecture_agent(state: DiscoveryState) -> dict:
    """
    Agent 7 — Generates repo-specific ASCII architecture diagram and
    structural observations plus telemetry and schematic analysis.
    """
    logger.info("Executing Architecture Blueprint Topology Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )

    repo_files = list(state.get("repo_structure", {}).keys())
    high_value = state.get("high_value_contents", {})
    repo_url = state.get("repo_url", "Unknown")
    owner = state.get("repo_owner", "")
    repo_name = state.get("repo_name", "")

    # Pass ALL high-value files for rich context
    focus_files = {p: c[:4000] for p, c in high_value.items()}

    system_prompt = (
        "You are a senior software architect. Deeply analyze the repository structure, source code, and configuration files.\n"
        "Your task:\n"
        "1. Generate an ASCII architecture diagram showing the ACTUAL architecture of THIS specific repository. "
        "Use box-drawing characters (+, |, -, v). Max 62 chars per line. Show real modules, layers, and data flows.\n"
        "2. Generate 5 to 8 specific architectural observations about THIS repository covering: "
        "design patterns, module separation, coupling/cohesion, scalability, error handling, entry points, and risks.\n"
        "Observations must be specific to THIS repo — no generic statements.\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        "  \"ascii_graph\": [\"line1\", \"line2\", ...],\n"
        "  \"observations\": [\"specific obs 1\", \"...\", \"specific obs 8\"]\n"
        "}"
    )

    user_prompt = (
        f"Repo: {owner}/{repo_name} ({repo_url})\n"
        f"Total Files: {len(repo_files)}\n"
        f"Full File Tree: {json.dumps(repo_files[:200])}\n\n"
        f"Key File Contents:\n"
    )
    for path, content in list(focus_files.items())[:20]:
        user_prompt += f"--- {path} ---\n{content}\n\n"

    try:
        analysis = llm.analyze(system_prompt, user_prompt)
        parsed = llm.clean_and_parse_json(analysis.get("raw_output", ""))
        graph = parsed.get("ascii_graph", [])
        obs = parsed.get("observations", [])

        if not graph or len(graph) < 3 or not obs:
            raise ValueError("Insufficient output from LLM.")

        logger.info(f"Architecture agent: {len(graph)} lines, {len(obs)} observations.")
        return {"architecture_graph": graph, "architecture_observations": obs}

    except Exception as e:
        logger.error(f"Architecture agent error: {e}")
        top_dirs = sorted({p.split("/")[0] for p in repo_files if "/" in p})[:8]
        root_files = [p for p in repo_files if "/" not in p][:6]
        repo_label = f"{owner}/{repo_name}" if owner else repo_url.split("/")[-1].replace(".git", "")
        max_width = 60
        border = "+" + "-" * (max_width - 2) + "+"

        fallback_lines = [border]
        fallback_lines.append(f"|  REPOSITORY: {repo_label:<{max_width - 16}}|")
        fallback_lines.append(border)
        if top_dirs:
            fallback_lines.append(f"|  DIRECTORIES:{'':<{max_width - 15}}|")
            for d in top_dirs:
                fallback_lines.append(f"|    [{d}/]{'':<{max_width - len(d) - 8}}|")
        if root_files:
            fallback_lines.append(f"|  ROOT FILES:{'':<{max_width - 14}}|")
            for f in root_files:
                fallback_lines.append(f"|    {f}{'':<{max_width - len(f) - 6}}|")
        fallback_lines.append(border)

        return {
            "architecture_graph": fallback_lines,
            "architecture_observations": [
                f"Repository '{repo_label}' contains {len(repo_files)} files across {len(top_dirs)} top-level directories.",
                "ASCII diagram auto-generated from file tree — re-run for LLM-generated architecture.",
                "Review code organization manually to confirm component boundaries.",
            ]
        }


def run_telemetry_agent(state: DiscoveryState) -> dict:
    """
    Agent 8 — Telemetry & Observability Analysis Agent.
    Synthesizes all observability signals found across the repo:
    logging, metrics, tracing, health checks, error tracking, alerting.
    """
    logger.info("Executing Telemetry & Observability Analysis Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )

    high_value = state.get("high_value_contents", {})
    all_file_paths = list(state.get("repo_structure", {}).keys())
    sec_data = state.get("security_observability", {})
    owner = state.get("repo_owner", "")
    repo_name_val = state.get("repo_name", "")

    # Combine all content for deep telemetry scan
    context_parts = [f"=== {p} ===\n{c[:3000]}" for p, c in high_value.items()]
    all_paths_str = "\n".join(all_file_paths[:200])
    # Pre-existing security agent findings
    existing_obs = sec_data.get("observability_posture", "")
    existing_logging = sec_data.get("logging_frameworks", [])

    context = (
        f"=== REPOSITORY: {owner}/{repo_name_val} ===\n"
        f"=== FILE PATHS ===\n{all_paths_str}\n\n"
        f"=== EXISTING OBSERVABILITY FINDINGS ===\n"
        f"Logging: {existing_logging}\nObservability: {existing_obs}\n\n"
        + "\n\n".join(context_parts[:25])
    )

    system_prompt = (
        "You are a Site Reliability Engineer and observability expert. "
        "Perform a deep telemetry analysis of this specific repository.\n"
        "Identify every observable signal in the codebase:\n"
        "- Logging: frameworks, log levels used, structured vs unstructured, log destinations\n"
        "- Metrics: Prometheus, Datadog, StatsD, custom counters/gauges found\n"
        "- Tracing: OpenTelemetry, Jaeger, Zipkin, trace context propagation\n"
        "- Health checks: /health, /ready, /metrics endpoints detected\n"
        "- Error tracking: Sentry, Rollbar, custom error handlers\n"
        "- Alerting: PagerDuty, OpsGenie, notification hooks\n"
        "- Performance: caching patterns, rate limiting, timeout handling\n"
        "Be specific about file names and exact library names found. "
        "If a category has nothing, say 'Not implemented' with a recommendation.\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        "  \"telemetry_summary\": \"2-3 sentences on the overall observability maturity of this repo.\",\n"
        "  \"logging\": {\n"
        "    \"frameworks\": [\"e.g. Python logging, Winston\"],\n"
        "    \"log_levels\": [\"DEBUG\", \"INFO\", \"ERROR\"],\n"
        "    \"structured\": true,\n"
        "    \"destinations\": [\"stdout\", \"file\", \"cloud\"],\n"
        "    \"assessment\": \"Brief assessment of logging quality\"\n"
        "  },\n"
        "  \"metrics\": {\n"
        "    \"tools\": [\"Prometheus\", \"Datadog\"],\n"
        "    \"endpoints\": [\"/metrics\"],\n"
        "    \"assessment\": \"Brief assessment\"\n"
        "  },\n"
        "  \"tracing\": {\n"
        "    \"tools\": [\"OpenTelemetry\"],\n"
        "    \"assessment\": \"Brief assessment\"\n"
        "  },\n"
        "  \"health_checks\": {\n"
        "    \"endpoints\": [\"/health\", \"/ready\"],\n"
        "    \"assessment\": \"Brief assessment\"\n"
        "  },\n"
        "  \"error_tracking\": {\n"
        "    \"tools\": [\"Sentry\"],\n"
        "    \"assessment\": \"Brief assessment\"\n"
        "  },\n"
        "  \"performance\": {\n"
        "    \"caching\": \"Detected caching patterns\",\n"
        "    \"rate_limiting\": \"Detected rate limiting\",\n"
        "    \"timeouts\": \"Detected timeout handling\"\n"
        "  },\n"
        "  \"observability_score\": \"1-10 score with 1 sentence explanation\",\n"
        "  \"recommendations\": [\"Specific improvement recommendation 1\", \"Recommendation 2\"]\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "telemetry_summary": {"type": "string"},
            "logging": {"type": "object"},
            "metrics": {"type": "object"},
            "tracing": {"type": "object"},
            "health_checks": {"type": "object"},
            "error_tracking": {"type": "object"},
            "performance": {"type": "object"},
            "observability_score": {"type": "string"},
            "recommendations": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["telemetry_summary", "logging", "metrics", "tracing", "observability_score", "recommendations"]
    }

    result = {
        "telemetry_summary": "Telemetry analysis requires a valid LLM API key. Configure OpenAI or Gemini in the settings panel.",
        "logging": {"frameworks": existing_logging, "log_levels": [], "structured": False, "destinations": ["stdout"], "assessment": existing_obs or "No LLM analysis available."},
        "metrics": {"tools": [], "endpoints": [], "assessment": "Not implemented — add Prometheus or Datadog."},
        "tracing": {"tools": [], "assessment": "Not implemented — add OpenTelemetry."},
        "health_checks": {"endpoints": [], "assessment": "Not detected — add /health and /ready endpoints."},
        "error_tracking": {"tools": [], "assessment": "Not detected — add Sentry or Rollbar."},
        "performance": {"caching": "Not detected.", "rate_limiting": "Not detected.", "timeouts": "Not detected."},
        "observability_score": "",
        "recommendations": [
            "Configure a valid LLM API key (OpenAI or Gemini) to enable full telemetry analysis.",
            "Add structured logging with correlation IDs.",
            "Implement /health and /ready endpoints for service probes.",
        ]
    }

    try:
        response = llm.analyze(system_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(response.get("raw_output", ""))
        if isinstance(parsed, dict):
            result = parsed
            logger.info(f"Telemetry agent: score={result.get('observability_score', 'N/A')}")
    except Exception as e:
        logger.error(f"Telemetry agent error: {e}")

    return {"telemetry_analysis": result}


def run_schematic_agent(state: DiscoveryState) -> dict:
    """
    Agent 9 — Deep Schematic Analysis Agent.
    Performs deep code-level schematic analysis: data flows, module dependency
    graph, API endpoint catalog, configuration management, messaging patterns,
    authentication flows, and database access patterns.
    """
    logger.info("Executing Deep Schematic Analysis Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )

    high_value = state.get("high_value_contents", {})
    all_file_paths = list(state.get("repo_structure", {}).keys())
    owner = state.get("repo_owner", "")
    repo_name_val = state.get("repo_name", "")
    doc_data = state.get("doc_analysis", {})
    dep_data = state.get("dependency_analysis", {})

    # Use ALL high-value file content for deep schematic scan
    context_parts = [f"=== {p} ===\n{c[:3500]}" for p, c in high_value.items()]
    all_paths_str = "\n".join(all_file_paths[:200])

    context = (
        f"=== REPOSITORY: {owner}/{repo_name_val} ===\n"
        f"=== ALL FILE PATHS ===\n{all_paths_str}\n\n"
        f"=== KNOWN DEPENDENCIES ===\n{json.dumps(dep_data.get('dependency_table', [])[:10])}\n\n"
        f"=== KNOWN API ROUTES ===\n{json.dumps(doc_data.get('api_documentation', [])[:10])}\n\n"
        + "\n\n".join(context_parts[:25])
    )

    system_prompt = (
        "You are a senior software architect performing deep schematic analysis. "
        "Analyze this repository's source code to map its internal structure at a code level.\n"
        "Produce a comprehensive schematic analysis covering:\n"
        "1. Data flow: how data enters the system, is processed, and exits\n"
        "2. Module dependency graph: which modules import/depend on which\n"
        "3. Complete API surface: all HTTP endpoints, WebSocket, gRPC, or CLI interfaces\n"
        "4. Database access patterns: how and where the DB is accessed, queries found\n"
        "5. Authentication/authorization flow: how auth is enforced through the code\n"
        "6. Configuration management: how config is loaded, validated, and used\n"
        "7. Messaging/event patterns: queues, pub/sub, event emitters found\n"
        "8. Error handling strategy: how exceptions are caught and handled\n"
        "Be specific — reference actual file names, function names, class names found in the code.\n"
        "Return ONLY valid JSON:\n"
        "{\n"
        "  \"schematic_summary\": \"2-3 sentences describing the overall code architecture pattern.\",\n"
        "  \"data_flow\": [\"Step 1: data enters via...\", \"Step 2: processed by...\"],\n"
        "  \"module_dependencies\": [\n"
        "    { \"module\": \"actual_module_name\", \"depends_on\": [\"dep1\", \"dep2\"], \"role\": \"What it does\" }\n"
        "  ],\n"
        "  \"api_surface\": [\n"
        "    { \"endpoint\": \"/route\", \"method\": \"GET\", \"auth_required\": true, \"description\": \"...\" }\n"
        "  ],\n"
        "  \"database_access_patterns\": [\"Pattern 1: ORM queries in service layer\"],\n"
        "  \"auth_flow\": \"Description of how authentication and authorization works in the code.\",\n"
        "  \"config_management\": \"How configuration is loaded (env vars, config files, etc.)\",\n"
        "  \"messaging_patterns\": [\"Pattern found or 'No messaging system detected'\"],\n"
        "  \"error_handling_strategy\": \"How the codebase handles exceptions and errors.\"\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "schematic_summary": {"type": "string"},
            "data_flow": {"type": "array", "items": {"type": "string"}},
            "module_dependencies": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "module": {"type": "string"},
                        "depends_on": {"type": "array", "items": {"type": "string"}},
                        "role": {"type": "string"}
                    },
                    "required": ["module", "depends_on", "role"]
                }
            },
            "api_surface": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "endpoint": {"type": "string"},
                        "method": {"type": "string"},
                        "auth_required": {"type": "boolean"},
                        "description": {"type": "string"}
                    },
                    "required": ["endpoint", "method", "auth_required", "description"]
                }
            },
            "database_access_patterns": {"type": "array", "items": {"type": "string"}},
            "auth_flow": {"type": "string"},
            "config_management": {"type": "string"},
            "messaging_patterns": {"type": "array", "items": {"type": "string"}},
            "error_handling_strategy": {"type": "string"}
        },
        "required": [
            "schematic_summary", "data_flow", "module_dependencies",
            "api_surface", "auth_flow", "config_management", "error_handling_strategy"
        ]
    }

    result = {
        "schematic_summary": "",
        "data_flow": [],
        "module_dependencies": [],
        "api_surface": doc_data.get("api_documentation", []),
        "database_access_patterns": [],
        "auth_flow": "Analysis pending.",
        "config_management": "Analysis pending.",
        "messaging_patterns": [],
        "error_handling_strategy": "Analysis pending."
    }

    try:
        response = llm.analyze(system_prompt, context, response_schema=schema)
        parsed = llm.clean_and_parse_json(response.get("raw_output", ""))
        if isinstance(parsed, dict):
            result = parsed
            logger.info(
                f"Schematic agent: {len(result.get('module_dependencies', []))} modules, "
                f"{len(result.get('api_surface', []))} endpoints."
            )
    except Exception as e:
        logger.error(f"Schematic agent error: {e}")

    return {"schematic_analysis": result}


def construct_discovery_graph():
    """Build and compile the 9-node LangGraph discovery pipeline."""
    workflow = StateGraph(DiscoveryState)

    # Node 1: Repository ingestion & file fetching
    workflow.add_node("repository_analyzer",    run_repo_agent)
    # Node 2: Technology stack identification
    workflow.add_node("technology_discovery",   run_tech_agent)
    # Node 3: Dependency and package mapping
    workflow.add_node("dependency_discovery",   run_dependency_agent)
    # Node 4: Infrastructure & deployment detection
    workflow.add_node("infrastructure_discovery", run_infra_agent)
    # Node 5: Security audit & basic observability
    workflow.add_node("security_auditor",       run_security_agent)
    # Node 6: Documentation mining (README, docs/, API docs)
    workflow.add_node("documentation_miner",    run_doc_agent)
    # Node 7: Architecture diagram & structural observations
    workflow.add_node("architecture_analyzer",  run_architecture_agent)
    # Node 8: Telemetry & observability deep analysis
    workflow.add_node("telemetry_analyzer",     run_telemetry_agent)
    # Node 9: Deep schematic code analysis
    workflow.add_node("schematic_analyzer",     run_schematic_agent)
    # Node 10: Report consolidation
    workflow.add_node("report_generator",       run_report_agent)

    # Linear pipeline — each agent feeds into the next
    workflow.set_entry_point("repository_analyzer")
    workflow.add_edge("repository_analyzer",      "technology_discovery")
    workflow.add_edge("technology_discovery",     "dependency_discovery")
    workflow.add_edge("dependency_discovery",     "infrastructure_discovery")
    workflow.add_edge("infrastructure_discovery", "security_auditor")
    workflow.add_edge("security_auditor",         "documentation_miner")
    workflow.add_edge("documentation_miner",      "architecture_analyzer")
    workflow.add_edge("architecture_analyzer",    "telemetry_analyzer")
    workflow.add_edge("telemetry_analyzer",       "schematic_analyzer")
    workflow.add_edge("schematic_analyzer",       "report_generator")
    workflow.add_edge("report_generator",         END)

    return workflow.compile()
