export interface DiscoveryRequest {
  repo_url: string
  github_token?: string | null
  omniroute_key?: string | null
  omniroute_url?: string | null
  gemini_key?: string | null
  openai_key?: string | null
  active_provider?: string | null
  format: 'docx' | 'pdf'
}

export interface DiscoveryResponse {
  status: string
  message: string
  report_path: string
  repo: string
  files_scanned: number
  manifests_fetched: number
  payload: DiscoveryPayload
}

export interface DiscoveryPayload {
  repo_url: string
  repo_name: string
  repo_owner: string
  files_scanned: number
  application_overview: ApplicationOverview
  technology_stack: TechnologyStack
  dependency_analysis: DependencyAnalysis
  infrastructure_insights: InfrastructureInsights
  security_observability: SecurityObservability
  telemetry_analysis: TelemetryAnalysis
  schematic_analysis: SchematicAnalysis
  doc_analysis: DocAnalysis
  architecture_graph: string[]
  architecture_observations: string[]
}

export interface ApplicationOverview {
  executive_summary: string
  purpose: string
  how_it_works: string
  architecture_style: string
  repo_type: string
  system_components_summary: string
  highlights: {
    what: string
    stack: string
    scale: string
    risk: string
    action: string
  }
  logical_components: LogicalComponent[]
  assumptions: string[]
  limitations: string[]
  outcomes: string[]
}

export interface LogicalComponent {
  name: string
  path: string
  role_purpose: string
}

export interface TechnologyStack {
  stack_summary: string
  tech_stack_table: TechStackEntry[]
}

export interface TechStackEntry {
  layer: string
  technology: string
  version: string
  usage: string
}

export interface DependencyAnalysis {
  database_summary: string
  dependency_table: DependencyEntry[]
  persistence_roadmap: PersistenceEntry[]
  internal_dependencies: string[]
  external_apis: string[]
  third_party_integrations: string[]
}

export interface DependencyEntry {
  package: string
  scope: string
  purpose: string
}

export interface PersistenceEntry {
  layer: string
  storage_data: string
  engine: string
  benefit: string
}

export interface InfrastructureInsights {
  infra_summary: string
  scaling_configurations: ScalingConfig[]
  cloud_services: string[]
  containerization: { has_docker: boolean; details: string }
  cicd_pipelines: string[]
  deployment_targets: string[]
}

export interface ScalingConfig {
  property: string
  constraint: string
  recommendation: string
}

export interface SecurityObservability {
  security_summary: string
  security_risks: SecurityRisk[]
  observability_posture: string
  logging_frameworks: string[]
  auth_mechanisms: string[]
}

export interface SecurityRisk {
  risk_id: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  detail: string
  target: string
  mitigation: string
}

export interface TelemetryAnalysis {
  telemetry_summary: string
  observability_score: string
  recommendations: string[]
  logging: TelemetryDimension
  metrics: TelemetryDimension
  tracing: TelemetryDimension
  health_checks: TelemetryDimension & { endpoints: string[] }
  error_tracking: TelemetryDimension
  performance: PerformanceDetail
}

export interface TelemetryDimension {
  frameworks?: string[]
  tools?: string[]
  assessment: string
}

export interface PerformanceDetail {
  caching: string
  rate_limiting: string
  timeouts: string
}

export interface SchematicAnalysis {
  schematic_summary: string
  data_flow: string[]
  module_dependencies: ModuleDependency[]
  api_surface: ApiEndpoint[]
  database_access_patterns: string[]
  auth_flow: string
  config_management: string
  messaging_patterns: string[]
  error_handling_strategy: string
}

export interface ModuleDependency {
  module: string
  depends_on: string[]
  role: string
}

export interface ApiEndpoint {
  endpoint: string
  method: string
  auth_required: boolean
  description: string
}

export interface DocAnalysis {
  doc_summary: string
  setup_instructions: string[]
  api_documentation: ApiEndpoint[]
  configuration_requirements: { key: string; description: string; required: boolean }[]
  key_features: string[]
  documentation_quality: string
}

export interface AgentStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

export interface LLMProvider {
  id: string
  name: string
  description: string
  icon: string
  color: string
  defaultEndpoint?: string
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: 'omniroute',
    name: 'OmniRoute',
    description: 'Default enterprise routing layer',
    icon: 'route',
    color: '#86BC25',
    defaultEndpoint: 'https://api.omniroute.ai/v1'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: "Google's multimodal AI model",
    icon: 'sparkles',
    color: '#4285F4',
    defaultEndpoint: 'https://generativelanguage.googleapis.com'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 and GPT-3.5 models',
    icon: 'brain',
    color: '#10A37F',
    defaultEndpoint: 'https://api.openai.com/v1'
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3 family of models',
    icon: 'message-square',
    color: '#D4A574',
    defaultEndpoint: 'https://api.anthropic.com'
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    description: 'Microsoft Azure OpenAI Service',
    icon: 'cloud',
    color: '#0078D4',
    defaultEndpoint: 'https://{resource}.openai.azure.com'
  },
]