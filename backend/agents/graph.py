from langgraph.graph import StateGraph, END
from agents.state import DiscoveryState
from agents.repo_agent import run_repo_agent
from agents.tech_agent import run_tech_agent
from agents.dependency_agent import run_dependency_agent
from agents.infra_agent import run_infra_agent
from agents.security_agent import run_security_agent
from agents.report_agent import run_report_agent

def construct_discovery_graph() -> StateGraph:
    workflow = StateGraph(DiscoveryState)
    
    # Register Isolated Agent Files
    workflow.add_node("analyze_structure", run_repo_agent)
    workflow.add_node("discover_tech", run_tech_agent)
    workflow.add_node("analyze_dependencies", run_dependency_agent)
    workflow.add_node("discover_infra", run_infra_agent)
    workflow.add_node("audit_security", run_security_agent)
    workflow.add_node("compile_report", run_report_agent)
    
    # Establish Pure Deterministic Execution Chain
    workflow.set_entry_point("analyze_structure")
    workflow.add_edge("analyze_structure", "discover_tech")
    workflow.add_edge("discover_tech", "analyze_dependencies")
    workflow.add_edge("analyze_dependencies", "discover_infra")
    workflow.add_edge("discover_infra", "audit_security")
    workflow.add_edge("audit_security", "compile_report")
    workflow.add_edge("compile_report", END)
    
    return workflow.compile()