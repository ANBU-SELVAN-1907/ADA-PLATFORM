import os, logging, json
from typing import Dict, Any
from agents.state import DiscoveryState
from services.github_service import GitHubService
from services.llm_service import LLMService

logger = logging.getLogger("ADA.RepoAgent")

EXTS = {".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".rs", ".rb", ".java", ".cs", ".yaml", ".yml", ".toml", ".json", ".env", ".md", ".txt"}
MANIFS = {"requirements.txt", "pyproject.toml", "package.json", "go.mod", "cargo.toml", "pom.xml", "build.gradle", "makefile", "dockerfile", "docker-compose.yml"}

def run_repo_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info("Executing Repository Ingestion...")
    url = state.get("repo_url", "")
    if not url: return {"repo_owner": "", "repo_name": "", "repo_branch": "", "repo_structure": {}, "high_value_contents": {}, "application_overview": {}, "execution_logs": ["ERROR: url missing"]}
    
    try:
        gh = GitHubService(token=state.get("github_token"))
        struct = gh.fetch_repository_structure(url)
        owner, repo, branch, flat = struct["owner"], struct["repo"], struct["branch"], struct["flat_structure"]
        paths = list(flat.keys())
        contents = {}

        # 1. README
        for rp in [p for p in paths if p.lower().split("/")[-1].startswith("readme")][:2]:
            c = gh.fetch_raw_content(owner, repo, branch, rp)
            if c: contents[rp] = c.strip()[:12000]

        # 2. Manifests & Configs
        for mp in [p for p in paths if p.split("/")[-1].lower() in MANIFS][:25]:
            if mp not in contents:
                c = gh.fetch_raw_content(owner, repo, branch, mp)
                if c: contents[mp] = "\n".join([l for l in c.splitlines() if l.strip()])[:5000]

        # 3. CI/CD & Infra
        for ip in [p for p in paths if any(k in p.lower() for k in [".github/workflows", "dockerfile", "terraform", "k8s", "deploy"])][:15]:
            if ip not in contents:
                c = gh.fetch_raw_content(owner, repo, branch, ip)
                if c: contents[ip] = c.strip()[:4000]

        # 4. Source Candidates
        rem = max(0, 60 - len(contents))
        srcs = [p for p in paths if os.path.splitext(p)[1].lower() in EXTS and p not in contents and not any(s in p.lower() for s in ["__pycache__", "node_modules", ".git", "dist/", "build/"])]
        prio = ["main", "app", "server", "index", "agent", "service", "model", "router", "controller", "db", "config"]
        srcs.sort(key=lambda p: next((len(prio) - i for i, kw in enumerate(prio) if kw in p.lower().split("/")[-1]), 0), reverse=True)

        for sp in srcs[:rem]:
            c = gh.fetch_raw_content(owner, repo, branch, sp)
            if c: contents[sp] = "\n".join([l for l in c.splitlines() if l.strip()])[:4000]

        overview = _gen_overview(state, owner, repo, branch, paths, contents)
        return {"repo_owner": owner, "repo_name": repo, "repo_branch": branch, "repo_structure": flat, "high_value_contents": contents, "application_overview": overview, "execution_logs": [f"Scanned {len(flat)} files, fetched {len(contents)}."]}
    except Exception as e:
        logger.exception(f"Repo agent failed: {e}")
        return {"repo_owner": "", "repo_name": "", "repo_branch": "main", "repo_structure": {}, "high_value_contents": {}, "application_overview": {}, "execution_logs": [f"ERROR: {e}"]}

def _gen_overview(state, owner, repo, branch, paths, contents) -> Dict[str, Any]:
    llm = LLMService(
        api_key=state.get("api_keys", {}).get("omniroute"),
        openai_key=state.get("api_keys", {}).get("openai"),
        gemini_key=state.get("api_keys", {}).get("gemini")
    )
    ctx_parts = [f"=== {p} ===\n{c}" for p, c in contents.items() if p.lower().split("/")[-1].startswith("readme")] + [f"=== {p} ===\n{c}" for p, c in contents.items() if not p.lower().split("/")[-1].startswith("readme")]
    user_context = f"Repo: {owner}/{repo} ({branch})\nFiles: {len(paths)}\nPaths:\n" + "\n".join(paths[:200]) + "\n\n" + "\n\n".join(ctx_parts[:30])

    sys_prompt = (
        "You are a senior software architect. Generate deep, repo-specific discovery details.\n"
        "Return valid JSON:\n"
        "{\n"
        "  \"executive_summary\": \"4-5 precise sentences on purpose, architecture, and maturity.\",\n"
        "  \"highlights\": {\"what\": \"...\", \"stack\": \"...\", \"scale\": \"...\", \"risk\": \"...\", \"action\": \"...\"},\n"
        "  \"purpose\": \"2 sentences.\", \"how_it_works\": \"3 sentences.\",\n"
        "  \"system_components_summary\": \"FastAPI Server, Agents Pipeline, UI\",\n"
        "  \"architecture_style\": \"Multi-Agent Pipeline\", \"repo_type\": \"AI Agent Framework\",\n"
        "  \"outcomes\": [], \"assumptions\": [], \"limitations\": [],\n"
        "  \"logical_components\": [{\"name\": \"...\", \"path\": \"...\", \"role_purpose\": \"...\"}]\n"
        "}"
    )

    schema = {
        "type": "object",
        "properties": {
            "executive_summary": {"type": "string"},
            "highlights": {"type": "object", "properties": {"what": {"type": "string"}, "stack": {"type": "string"}, "scale": {"type": "string"}, "risk": {"type": "string"}, "action": {"type": "string"}}, "required": ["what", "stack", "scale", "risk", "action"]},
            "purpose": {"type": "string"}, "how_it_works": {"type": "string"}, "system_components_summary": {"type": "string"}, "architecture_style": {"type": "string"}, "repo_type": {"type": "string"},
            "outcomes": {"type": "array", "items": {"type": "string"}}, "assumptions": {"type": "array", "items": {"type": "string"}}, "limitations": {"type": "array", "items": {"type": "string"}},
            "logical_components": {"type": "array", "items": {"type": "object", "properties": {"name": {"type": "string"}, "path": {"type": "string"}, "role_purpose": {"type": "string"}}, "required": ["name", "path", "role_purpose"]}}
        },
        "required": ["executive_summary", "highlights", "purpose", "how_it_works", "system_components_summary", "architecture_style", "repo_type", "outcomes", "assumptions", "limitations", "logical_components"]
    }

    try:
        resp = llm.analyze(sys_prompt, user_context, response_schema=schema)
        parsed = llm.clean_and_parse_json(resp["raw_output"])
        if isinstance(parsed, dict) and parsed.get("executive_summary"): return parsed
    except Exception as e:
        logger.warning(f"Overview LLM failed: {e}")

    return {
        "executive_summary": f"Discovery of {owner}/{repo} loaded {len(paths)} files.",
        "highlights": {"what": f"Repo {repo}", "stack": "Source files scanned.", "scale": f"{len(paths)} files", "risk": "LLM review required", "action": "Ensure API keys and re-run"},
        "purpose": f"Codebase topology scan for {repo}.", "how_it_works": "Loads repo metadata and files statically.",
        "system_components_summary": "Ingested Modules", "architecture_style": "Layered", "repo_type": "Source Code",
        "outcomes": ["Index files successfully"], "assumptions": ["GitHub API access"], "limitations": ["No runtime state assessment"],
        "logical_components": [{"name": "Repository Root", "path": "/", "role_purpose": "Source files root Container."}]
    }
