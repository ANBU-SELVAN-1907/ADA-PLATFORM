import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Literal
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel
import json

from config import settings
from agents.orchestration import construct_discovery_graph
from services.report_service import ReportService
from services.llm_service import active_provider_var

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("ADA.Main")

app = FastAPI(
    title="Deloitte AI Insights — Deep Schematic Discovery Engine",
    version=settings.APP_VERSION,
    description="Multi-agent framework for non-cloning codebase topology mapping and security scanning."
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# CORS middleware for secure cross-origin resource sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


class DiscoveryRequest(BaseModel):
    repo_url: str
    github_token: Optional[str] = None
    omniroute_key: Optional[str] = None
    openai_key: Optional[str] = None
    gemini_key: Optional[str] = None
    active_provider: Optional[str] = None
    format: Literal["docx", "pdf"] = "docx"


@app.post("/api/v1/discover")
@limiter.limit("5/minute")
async def run_discovery(request: Request, payload: DiscoveryRequest):
    logger.info(f"Discovery request received: {payload.repo_url} [{payload.format.upper()}]")

    omniroute_api_key = payload.omniroute_key or os.getenv("ADA_OMNIROUTE_KEY", "")
    openai_api_key = payload.openai_key or os.getenv("ADA_OPENAI_KEY", os.getenv("OPENAI_API_KEY", ""))
    gemini_api_key = payload.gemini_key or os.getenv("ADA_GEMINI_KEY", os.getenv("GEMINI_API_KEY", ""))

    if not (omniroute_api_key or openai_api_key or gemini_api_key):
        raise HTTPException(
            status_code=400,
            detail="Missing required API key. Please provide at least one key for Omniroute, Gemini, or OpenAI."
        )

    # Full initial state — all keys pre-declared so LangGraph carries them correctly
    initial_state = {
        "repo_url": payload.repo_url,
        "github_token": payload.github_token or os.getenv("ADA_GITHUB_TOKEN", None),
        "active_provider": payload.active_provider,
        "api_keys": {
            "omniroute": omniroute_api_key,
            "openai": openai_api_key,
            "gemini": gemini_api_key
        },

        # Populated by repo_agent
        "repo_owner": "",
        "repo_name": "",
        "repo_branch": "",
        "repo_structure": {},           # flat dict: path -> size string
        "high_value_contents": {},      # dict: path -> file content string
        "application_overview": {},     # AI-generated summary of the repo

        # Populated by analysis agents
        "technology_stack": {},
        "dependency_analysis": {},
        "infrastructure_insights": {},
        "security_observability": {},
        "doc_analysis": {},
        "telemetry_analysis": {},
        "schematic_analysis": {},

        # Populated by architecture_agent
        "architecture_graph": [],       # list of ASCII diagram lines
        "architecture_observations": [], # list of CAST-style observation strings

        "report_payload": {},
        "execution_logs": []
    }

    try:
        compiled_graph = construct_discovery_graph()
        logger.info("LangGraph pipeline compiled. Invoking 7-agent discovery chain...")
        token = active_provider_var.set(payload.active_provider)
        try:
            final_state = compiled_graph.invoke(initial_state)
        finally:
            active_provider_var.reset(token)

        # Propagate repo_url into final state for the report service
        final_state["repo_url"] = payload.repo_url

        repo_base = final_state.get("repo_name") or payload.repo_url.split("/")[-1].replace(".git", "")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"{repo_base}_{timestamp}"

        reporter = ReportService()
        output_filepath = reporter.compile_report(
            payload=final_state,
            base_name=base_name,
            output_dir=settings.OUTPUT_DIR,
            file_format=payload.format
        )

        # Construct the response payload matching DiscoveryPayload schema
        response_payload = {
            "repo_url": final_state.get("repo_url", payload.repo_url),
            "repo_name": final_state.get("repo_name", ""),
            "repo_owner": final_state.get("repo_owner", ""),
            "files_scanned": len(final_state.get("repo_structure", {})),
            "application_overview": final_state.get("application_overview", {}),
            "technology_stack": final_state.get("technology_stack", {}),
            "dependency_analysis": final_state.get("dependency_analysis", {}),
            "infrastructure_insights": final_state.get("infrastructure_insights", {}),
            "security_observability": final_state.get("security_observability", {}),
            "telemetry_analysis": final_state.get("telemetry_analysis", {}),
            "schematic_analysis": final_state.get("schematic_analysis", {}),
            "doc_analysis": final_state.get("doc_analysis", {}),
            "architecture_graph": final_state.get("architecture_graph", []),
            "architecture_observations": final_state.get("architecture_observations", [])
        }

        # Convert local absolute path to public download path or use S3 URL
        if output_filepath.startswith("http://") or output_filepath.startswith("https://"):
            download_path = output_filepath
        else:
            download_path = f"/output/{Path(output_filepath).name}"

        logger.info(f"Report successfully compiled: {output_filepath}")
        return {
            "status": "success",
            "message": f"Enterprise discovery report compiled as {payload.format.upper()}.",
            "report_path": download_path,
            "repo": f"{final_state.get('repo_owner','')}/{final_state.get('repo_name','')}",
            "files_scanned": len(final_state.get("repo_structure", {})),
            "manifests_fetched": len(final_state.get("high_value_contents", {})),
            "payload": response_payload
        }

    except Exception as e:
        logger.exception("Fatal error during multi-agent pipeline execution.")
        raise HTTPException(status_code=500, detail=f"Pipeline Execution Fault: {str(e)}")


@app.post("/api/v1/discover/stream")
@limiter.limit("5/minute")
async def run_discovery_stream(request: Request, payload: DiscoveryRequest):
    logger.info(f"Discovery stream request received: {payload.repo_url} [{payload.format.upper()}]")

    omniroute_api_key = payload.omniroute_key or os.getenv("ADA_OMNIROUTE_KEY", "")
    openai_api_key = payload.openai_key or os.getenv("ADA_OPENAI_KEY", os.getenv("OPENAI_API_KEY", ""))
    gemini_api_key = payload.gemini_key or os.getenv("ADA_GEMINI_KEY", os.getenv("GEMINI_API_KEY", ""))

    if not (omniroute_api_key or openai_api_key or gemini_api_key):
        raise HTTPException(
            status_code=400,
            detail="Missing required API key. Please provide at least one key for Omniroute, Gemini, or OpenAI."
        )

    initial_state = {
        "repo_url": payload.repo_url,
        "github_token": payload.github_token or os.getenv("ADA_GITHUB_TOKEN", None),
        "active_provider": payload.active_provider,
        "api_keys": {
            "omniroute": omniroute_api_key,
            "openai": openai_api_key,
            "gemini": gemini_api_key
        },
        "repo_owner": "",
        "repo_name": "",
        "repo_branch": "",
        "repo_structure": {},
        "high_value_contents": {},
        "application_overview": {},
        "technology_stack": {},
        "dependency_analysis": {},
        "infrastructure_insights": {},
        "security_observability": {},
        "doc_analysis": {},
        "telemetry_analysis": {},
        "schematic_analysis": {},
        "architecture_graph": [],
        "architecture_observations": [],
        "report_payload": {},
        "execution_logs": []
    }

    def sse_generator():
        token = active_provider_var.set(payload.active_provider)
        try:
            # Yield the starting of the first step
            yield f"event: agent_start\ndata: {json.dumps({'agentId': 'repo'})}\n\n"
            
            current_state = initial_state.copy()
            
            try:
                compiled_graph = construct_discovery_graph()
                
                NODE_TO_STEP_ID = {
                    "repository_analyzer": "repo",
                    "technology_discovery": "tech",
                    "dependency_discovery": "dep",
                    "infrastructure_discovery": "infra",
                    "security_auditor": "sec",
                    "documentation_miner": "doc",
                    "architecture_analyzer": "arch",
                    "telemetry_analyzer": "tele",
                    "schematic_analyzer": "schem",
                    "report_generator": "report"
                }
                
                steps_order = [
                    "repository_analyzer",
                    "technology_discovery",
                    "dependency_discovery",
                    "infrastructure_discovery",
                    "security_auditor",
                    "documentation_miner",
                    "architecture_analyzer",
                    "telemetry_analyzer",
                    "schematic_analyzer",
                    "report_generator"
                ]
                
                def get_next_node(current_node: str) -> Optional[str]:
                    try:
                        idx = steps_order.index(current_node)
                        if idx + 1 < len(steps_order):
                            return steps_order[idx + 1]
                    except ValueError:
                        pass
                    return None
                
                # Run LangGraph streaming execution
                for output in compiled_graph.stream(initial_state):
                    for node_name, state_delta in output.items():
                        current_state.update(state_delta)
                        
                        step_id = NODE_TO_STEP_ID.get(node_name)
                        if step_id:
                            logs = state_delta.get("execution_logs", [])
                            if not logs:
                                logs = [f"Agent {step_id.upper()} execution completed successfully."]
                            
                            yield f"event: agent_complete\ndata: {json.dumps({'agentId': step_id, 'logs': logs})}\n\n"
                            
                            next_node = get_next_node(node_name)
                            if next_node:
                                next_step_id = NODE_TO_STEP_ID.get(next_node)
                                if next_step_id:
                                    yield f"event: agent_start\ndata: {json.dumps({'agentId': next_step_id})}\n\n"
                
                # Compile the report
                repo_base = current_state.get("repo_name") or payload.repo_url.split("/")[-1].replace(".git", "")
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_name = f"{repo_base}_{timestamp}"
                
                reporter = ReportService()
                output_filepath = reporter.compile_report(
                    payload=current_state,
                    base_name=base_name,
                    output_dir=settings.OUTPUT_DIR,
                    file_format=payload.format
                )
                
                response_payload = {
                    "repo_url": current_state.get("repo_url", payload.repo_url),
                    "repo_name": current_state.get("repo_name", ""),
                    "repo_owner": current_state.get("repo_owner", ""),
                    "files_scanned": len(current_state.get("repo_structure", {})),
                    "application_overview": current_state.get("application_overview", {}),
                    "technology_stack": current_state.get("technology_stack", {}),
                    "dependency_analysis": current_state.get("dependency_analysis", {}),
                    "infrastructure_insights": current_state.get("infrastructure_insights", {}),
                    "security_observability": current_state.get("security_observability", {}),
                    "telemetry_analysis": current_state.get("telemetry_analysis", {}),
                    "schematic_analysis": current_state.get("schematic_analysis", {}),
                    "doc_analysis": current_state.get("doc_analysis", {}),
                    "architecture_graph": current_state.get("architecture_graph", []),
                    "architecture_observations": current_state.get("architecture_observations", [])
                }
                
                if output_filepath.startswith("http://") or output_filepath.startswith("https://"):
                    download_path = output_filepath
                else:
                    download_path = f"/output/{Path(output_filepath).name}"
                
                complete_data = {
                    "status": "success",
                    "message": f"Enterprise discovery report compiled as {payload.format.upper()}.",
                    "report_path": download_path,
                    "repo": f"{current_state.get('repo_owner','')}/{current_state.get('repo_name','')}",
                    "files_scanned": len(current_state.get("repo_structure", {})),
                    "manifests_fetched": len(current_state.get("high_value_contents", {})),
                    "payload": response_payload
                }
                
                yield f"event: complete\ndata: {json.dumps(complete_data)}\n\n"
                
            except Exception as e:
                logger.exception("Error during streaming discovery pipeline execution.")
                yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"
        finally:
            active_provider_var.reset(token)

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@app.get("/api/v1/health")
@limiter.limit("60/minute")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "engine": settings.APP_TYPE,
        "version": settings.APP_VERSION,
        "framework_layer": settings.VERSION_COUNT
    }

# 1. Mount the output directory to enable safe downloads
output_dir = Path("output")
output_dir.mkdir(parents=True, exist_ok=True)
app.mount("/output", StaticFiles(directory=output_dir), name="output")

# 2. Mount the production-built React assets if available
frontend_dist_path = Path(__file__).parent / "frontend" / "dist"
if frontend_dist_path.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist_path / "assets"), name="assets")

    @app.get("/{catchall:path}")
    async def serve_spa(catchall: str):
        file_path = frontend_dist_path / catchall
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist_path / "index.html")

