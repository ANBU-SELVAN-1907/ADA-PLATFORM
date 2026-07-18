from typing import Dict, List, Any, Optional, TypedDict

class DiscoveryState(TypedDict):
    """
    Centralized, strongly-typed state tracking matrix for the Multi-Agent framework.
    Maintains telemetry data payloads and discovery indicators deterministically.
    """
    repo_url: str
    github_token: Optional[str]
    api_keys: Dict[str, str]

    # Repo identity — populated by repo_agent
    repo_owner: str
    repo_name: str
    repo_branch: str

    # Flat dict: { "path/to/file.py": "1234" (size bytes) }
    repo_structure: Dict[str, str]
    # Flat dict: { "path/to/file.py": "<file content string>" }
    high_value_contents: Dict[str, str]

    # AI-generated application overview (repo_agent)
    application_overview: Dict[str, Any]

    # Core agent outputs
    technology_stack: Dict[str, Any]
    dependency_analysis: Dict[str, Any]
    infrastructure_insights: Dict[str, Any]
    security_observability: Dict[str, Any]

    # Documentation agent output (README, docs/, changelogs)
    doc_analysis: Dict[str, Any]

    # Architecture agent outputs
    architecture_graph: List[str]
    architecture_observations: List[str]

    # Deep analysis outputs
    telemetry_analysis: Dict[str, Any]
    schematic_analysis: Dict[str, Any]

    report_payload: Dict[str, Any]
    execution_logs: List[str]
