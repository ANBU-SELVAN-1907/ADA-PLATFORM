import logging
from typing import Dict, Any
from agents.state import DiscoveryState

logger = logging.getLogger('ADA.ReportAgent')

def run_report_agent(state: DiscoveryState) -> Dict[str, Any]:
    logger.info('Executing Report Generation Agent Consolidation')
    repo_url = state.get('repo_url', '')
    base_name = repo_url.split('/')[-1].replace('.git', '') if repo_url else 'repo'
    total_files = len(state.get('repo_structure', {}))
    owner = state.get('repo_owner', 'N/A')
    repo = state.get('repo_name', 'N/A')

    final_report = {
        'meta': {
            'app_version': '1.0.0',
            'version_count': 'ADA-V2',
            'app_type': 'Deep Schematic Discovery Engine',
            'base_name': base_name
        },
        'sections': {
            'application_summary': {
                'total_files_scanned': total_files,
                'repository_owner': owner,
                'repository_name': repo
            },
            'technology_stack': state.get('technology_stack', {}),
            'dependency_analysis': state.get('dependency_analysis', {}),
            'infrastructure_deployment': state.get('infrastructure_insights', {}),
            'security_observability': state.get('security_observability', {}),
            'doc_analysis': state.get('doc_analysis', {}),
            'telemetry_analysis': state.get('telemetry_analysis', {}),
            'schematic_analysis': state.get('schematic_analysis', {})
        }
    }
    return {'report_payload': final_report}
