import logging, json
from agents.state import DiscoveryState
from services.llm_service import LLMService

logger = logging.getLogger("ADA.ArchitectureAgent")

def run_architecture_agent(state: DiscoveryState) -> dict:
    logger.info("Executing Architecture Blueprint Topology Agent...")
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    paths = list(state.get("repo_structure", {}).keys())
    high_value = state.get("high_value_contents", {})

    context = f"Repo: {state.get('repo_owner')}/{state.get('repo_name')} ({state.get('repo_url')})\n" + f"Total Files: {len(paths)}\nTree: {json.dumps(paths[:200])}\n\nContents:\n" + "\n\n".join(
        [f"--- {p} ---\n{c[:4000]}" for p, c in list(high_value.items())[:20]]
    )

    sys_prompt = (
        "You are a senior software architect. Analyze the repo structure and files.\n"
        "1. Generate an ASCII architecture diagram showing modules and flows. Max 62 chars/line. Use box-drawing (+, |, -, v).\n"
        "2. Generate 5-8 specific architectural observations.\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"ascii_graph\": [\"line1\", \"line2\", ...],\n"
        "  \"observations\": [\"obs1\", \"obs2\", ...]\n"
        "}"
    )

    try:
        resp = llm.analyze(sys_prompt, context)
        parsed = llm.clean_and_parse_json(resp.get("raw_output", ""))
        graph, obs = parsed.get("ascii_graph", []), parsed.get("observations", [])
        if graph and len(graph) >= 3 and obs:
            return {"architecture_graph": graph, "architecture_observations": obs}
    except Exception as e:
        logger.error(f"Architecture agent error: {e}")

    top_dirs = sorted({p.split("/")[0] for p in paths if "/" in p})[:8]
    root_files = [p for p in paths if "/" not in p][:6]
    repo_label = state.get("repo_name") or "repository"
    max_w = 60
    border = "+" + "-" * (max_w - 2) + "+"

    fallback = [border, f"|  REPOSITORY: {repo_label:<{max_w - 16}}|", border]
    if top_dirs:
        fallback.append(f"|  DIRECTORIES:{'':<{max_w - 15}}|")
        fallback.extend([f"|    [{d}/]{'':<{max_w - len(d) - 8}}|" for d in top_dirs])
    if root_files:
        fallback.append(f"|  ROOT FILES:{'':<{max_w - 14}}|")
        fallback.extend([f"|    {f}{'':<{max_w - len(f) - 6}}|" for f in root_files])
    fallback.append(border)

    return {
        "architecture_graph": fallback,
        "architecture_observations": [
            f"Repository '{repo_label}' contains {len(paths)} files across {len(top_dirs)} directories.",
            "ASCII diagram auto-generated from file tree.",
            "Review code organization manually to confirm boundaries."
        ]
    }
