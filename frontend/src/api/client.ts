import type { DiscoveryRequest, DiscoveryResponse } from '../types'

const API_BASE = '/api/v1'

export async function discover(
  payload: DiscoveryRequest,
  onProgress?: (event: string) => void
): Promise<DiscoveryResponse> {
  const response = await fetch(`${API_BASE}/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Network error' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }

  const data: DiscoveryResponse = await response.json()
  onProgress?.('complete')
  return data
}

export async function getHealth(): Promise<{ status: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`)
  return response.json()
}

// Stream agent progress events via SSE
export function streamDiscovery(
  payload: DiscoveryRequest,
  callbacks: {
    onAgentStart?: (agentId: string) => void
    onAgentComplete?: (agentId: string, logs?: string[]) => void
    onComplete?: (response: DiscoveryResponse) => void
    onError?: (err: Error) => void
  }
): () => void {
  const controller = new AbortController()

  const run = async () => {
    try {
      const response = await fetch(`${API_BASE}/discover/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Network error' }))
        throw new Error(err.detail || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is empty')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.substring(6).trim()
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.substring(5).trim()
            try {
              const data = JSON.parse(dataStr)
              if (currentEvent === 'agent_start') {
                callbacks.onAgentStart?.(data.agentId)
              } else if (currentEvent === 'agent_complete') {
                callbacks.onAgentComplete?.(data.agentId, data.logs)
              } else if (currentEvent === 'complete') {
                callbacks.onComplete?.(data)
              } else if (currentEvent === 'error') {
                callbacks.onError?.(new Error(data.detail || 'Streaming error'))
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', dataStr, e)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Ignored
      }
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  run()

  return () => {
    controller.abort()
  }
}

// Mock data generator for development / demo mode
export function getMockResponse(): DiscoveryResponse {
  return {
    status: 'success',
    message: 'Analysis complete',
    report_path: '/output/ADA_test_mocked_run.docx',
    repo: 'acme/enterprise-api',
    files_scanned: 247,
    manifests_fetched: 12,
    payload: {
      repo_url: 'https://github.com/acme/enterprise-api',
      repo_name: 'enterprise-api',
      repo_owner: 'acme',
      files_scanned: 247,
      application_overview: {
        executive_summary: 'A production-grade REST API platform serving 2M+ daily requests with microservices architecture, deployed on Kubernetes with comprehensive observability.',
        purpose: 'Enterprise-grade REST API platform for internal and external service consumption.',
        how_it_works: 'Microservices communicate via gRPC internally and REST externally, with a central API gateway handling auth, rate limiting, and routing.',
        architecture_style: 'Microservices + Event-Driven',
        repo_type: 'Backend Service',
        system_components_summary: '12 microservices, 3 data stores, 2 message queues, 1 API gateway',
        highlights: {
          what: 'Enterprise API Platform',
          stack: 'Node.js, Python, PostgreSQL, Redis, Kafka',
          scale: '2M+ daily requests',
          risk: 'Hardcoded secrets in 3 config files',
          action: 'Rotate secrets, add KMS integration',
        },
        logical_components: [
          { name: 'API Gateway', path: '/gateway', role_purpose: 'Central entry point for all requests' },
          { name: 'Auth Service', path: '/services/auth', role_purpose: 'JWT validation and OAuth2 flows' },
          { name: 'User Service', path: '/services/users', role_purpose: 'User management CRUD operations' },
          { name: 'Notification Service', path: '/services/notify', role_purpose: 'Email/SMS/Push notification dispatch' },
          { name: 'Analytics Service', path: '/services/analytics', role_purpose: 'Event processing and reporting' },
        ],
        assumptions: ['Services run in Kubernetes namespace "production"', 'Redis cluster is shared across services'],
        limitations: ['No GraphQL support', 'Limited real-time capabilities'],
        outcomes: ['Full architectural map', 'Security risk register', 'Dependency audit', 'Performance recommendations'],
      },
      technology_stack: {
        stack_summary: 'Polyglot stack with Node.js primary, Python ML services, PostgreSQL for persistence.',
        tech_stack_table: [
          { layer: 'Runtime', technology: 'Node.js', version: '20.x', usage: 'API services, gateway' },
          { layer: 'Language', technology: 'TypeScript', version: '5.x', usage: 'All services' },
          { layer: 'Framework', technology: 'Express.js', version: '4.18', usage: 'HTTP routing' },
          { layer: 'Database', technology: 'PostgreSQL', version: '15', usage: 'Primary data store' },
          { layer: 'Cache', technology: 'Redis', version: '7.x', usage: 'Session, rate limiting, cache' },
          { layer: 'Message Queue', technology: 'Apache Kafka', version: '3.x', usage: 'Event streaming' },
          { layer: 'Container', technology: 'Docker', version: '24.x', usage: 'Containerization' },
          { layer: 'Orchestration', technology: 'Kubernetes', version: '1.28', usage: 'Production deployment' },
        ],
      },
      dependency_analysis: {
        database_summary: 'PostgreSQL 15 with read replicas. Redis for caching and pub/sub. No ORM — raw SQL via pg driver.',
        dependency_table: [
          { package: 'express', scope: 'prod', purpose: 'HTTP web framework' },
          { package: 'jsonwebtoken', scope: 'prod', purpose: 'JWT token generation/validation' },
          { package: 'pg', scope: 'prod', purpose: 'PostgreSQL client' },
          { package: 'ioredis', scope: 'prod', purpose: 'Redis client with cluster support' },
          { package: 'kafkajs', scope: 'prod', purpose: 'Kafka producer/consumer' },
          { package: 'zod', scope: 'prod', purpose: 'Runtime schema validation' },
          { package: 'jest', scope: 'dev', purpose: 'Testing framework' },
        ],
        persistence_roadmap: [
          { layer: 'Hot data', storage_data: 'Sessions, tokens', engine: 'Redis', benefit: 'Sub-ms access' },
          { layer: 'Warm data', storage_data: 'User profiles, orders', engine: 'PostgreSQL', benefit: 'ACID compliance' },
          { layer: 'Cold data', storage_data: 'Audit logs, archives', engine: 'S3', benefit: 'Cost-effective' },
        ],
        internal_dependencies: ['@acme/shared-types', '@acme/logger', '@acme/config'],
        external_apis: ['Stripe API', 'SendGrid', 'Twilio', 'AWS S3'],
        third_party_integrations: ['Datadog APM', 'PagerDuty', 'GitHub Actions'],
      },
      infrastructure_insights: {
        infra_summary: 'Kubernetes on AWS EKS with autoscaling. ArgoCD for GitOps. Infrastructure as Code via Terraform.',
        scaling_configurations: [
          { property: 'HPA min replicas', constraint: '3', recommendation: 'Increase to 5 for HA' },
          { property: 'CPU threshold', constraint: '70%', recommendation: 'Lower to 60% for buffer' },
          { property: 'Memory limit', constraint: '512Mi', recommendation: 'Profile and right-size' },
        ],
        cloud_services: ['AWS EKS', 'AWS RDS', 'AWS ElastiCache', 'AWS S3', 'AWS CloudFront'],
        containerization: { has_docker: true, details: 'Multi-stage Dockerfiles. Base image: node:20-alpine. No root user.' },
        cicd_pipelines: ['GitHub Actions: CI on PR, CD on main merge', 'ArgoCD: GitOps deployment', 'Snyk: Dependency scanning'],
        deployment_targets: ['EKS Production (us-east-1)', 'EKS Staging (us-west-2)'],
      },
      security_observability: {
        security_summary: 'Mixed posture. Strong auth layer but 3 critical secret exposure risks.',
        security_risks: [
          { risk_id: 'SEC-001', severity: 'CRITICAL', detail: 'DATABASE_URL hardcoded in config/database.js', target: '/config/database.js:12', mitigation: 'Move to AWS Secrets Manager or environment variable with KMS' },
          { risk_id: 'SEC-002', severity: 'HIGH', detail: 'JWT_SECRET uses weak default value in dev config committed to repo', target: '/config/dev.js:5', mitigation: 'Generate 256-bit secret, store in Secrets Manager' },
          { risk_id: 'SEC-003', severity: 'HIGH', detail: 'Missing rate limiting on /auth/login endpoint', target: '/routes/auth.js:34', mitigation: 'Add Redis-backed rate limiter: 5 req/min per IP' },
          { risk_id: 'SEC-004', severity: 'MEDIUM', detail: 'CORS allows all origins in non-production environments', target: '/middleware/cors.js:8', mitigation: 'Whitelist allowed origins per environment' },
          { risk_id: 'SEC-005', severity: 'LOW', detail: 'HTTP security headers missing (HSTS, CSP)', target: '/app.js', mitigation: 'Add helmet.js middleware' },
        ],
        observability_posture: 'Good — Datadog APM integrated. Structured logging present. Missing distributed tracing.',
        logging_frameworks: ['Winston', 'Datadog APM'],
        auth_mechanisms: ['JWT Bearer tokens', 'OAuth2 (Google, GitHub)', 'API Keys for service-to-service'],
      },
      telemetry_analysis: {
        telemetry_summary: 'Structured logging via Winston. Datadog APM for metrics. No distributed tracing (Jaeger/Zipkin).',
        observability_score: '6/10',
        recommendations: [
          'Add OpenTelemetry for distributed tracing',
          'Instrument Kafka consumer lag metrics',
          'Add custom business metrics (conversion rate, error rate by service)',
          'Implement SLO dashboards',
        ],
        logging: { frameworks: ['Winston'], assessment: 'Good — structured JSON logging with correlation IDs' },
        metrics: { tools: ['Datadog', 'Prometheus (partial)'], assessment: 'Moderate — system metrics collected, business metrics missing' },
        tracing: { assessment: 'Poor — no distributed trace context propagation between services' },
        health_checks: { endpoints: ['/health', '/ready'], assessment: 'Basic — liveness and readiness probes present' },
        error_tracking: { tools: ['Datadog Logs'], assessment: 'Moderate — errors captured but no Sentry/Rollbar for grouping' },
        performance: {
          caching: 'Redis cache on user profiles (TTL: 5min), API responses (TTL: 30s)',
          rate_limiting: 'Redis-backed, 1000 req/min global, per-route overrides',
          timeouts: 'Gateway: 30s, Service-to-service: 5s, DB queries: 10s',
        },
      },
      schematic_analysis: {
        schematic_summary: 'Clean separation of concerns. Gateway → Services → Data stores. Event-driven async ops via Kafka.',
        data_flow: [
          'Client → API Gateway (TLS, auth) → Service → DB',
          'Service → Kafka → Consumer Service → Notification dispatch',
          'Analytics events → Kafka → Stream processor → Data warehouse',
        ],
        module_dependencies: [
          { module: 'gateway', depends_on: ['auth-service', 'user-service'], role: 'Request routing and auth validation' },
          { module: 'auth-service', depends_on: ['postgres', 'redis'], role: 'Token issuance and validation' },
          { module: 'user-service', depends_on: ['postgres', 'kafka'], role: 'User CRUD with event emission' },
        ],
        api_surface: [
          { endpoint: '/api/v1/auth/login', method: 'POST', auth_required: false, description: 'Authenticate user and return JWT' },
          { endpoint: '/api/v1/users/:id', method: 'GET', auth_required: true, description: 'Get user profile' },
          { endpoint: '/api/v1/users', method: 'POST', auth_required: false, description: 'Create new user account' },
          { endpoint: '/api/v1/health', method: 'GET', auth_required: false, description: 'Service health check' },
        ],
        database_access_patterns: ['Repository pattern via service layer', 'No direct DB access from controllers', 'Connection pooling via pg-pool'],
        auth_flow: 'JWT Bearer → Gateway validates → Passes user context in X-User-Id header → Services trust header',
        config_management: 'dotenv for local, AWS Parameter Store for staging/prod, Kubernetes secrets for sensitive values',
        messaging_patterns: ['Command messages for service-to-service', 'Event sourcing for audit trail', 'Retry with exponential backoff'],
        error_handling_strategy: 'Centralized error middleware, standardized error response format, correlation IDs for tracing',
      },
      doc_analysis: {
        doc_summary: 'Moderate documentation quality. README present but outdated. API docs via Swagger/OpenAPI. Missing architecture decision records.',
        setup_instructions: [
          'Clone repo: git clone https://github.com/acme/enterprise-api',
          'Install dependencies: npm install',
          'Copy environment: cp .env.example .env',
          'Start services: docker-compose up -d',
          'Run migrations: npm run migrate',
          'Start dev server: npm run dev',
        ],
        api_documentation: [
          { endpoint: '/api/v1/auth/login', method: 'POST', auth_required: false, description: 'Authenticate user' },
          { endpoint: '/api/v1/users', method: 'GET', auth_required: true, description: 'List users (admin only)' },
        ],
        configuration_requirements: [
          { key: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true },
          { key: 'REDIS_URL', description: 'Redis connection string', required: true },
          { key: 'JWT_SECRET', description: 'JWT signing secret (min 256 bits)', required: true },
          { key: 'KAFKA_BROKERS', description: 'Comma-separated Kafka broker list', required: true },
        ],
        key_features: ['JWT + OAuth2 authentication', 'Rate limiting', 'Request validation via Zod', 'Structured logging', 'Health checks'],
        documentation_quality: 'MODERATE — API docs complete via Swagger, but architecture docs missing. No ADRs.',
      },
      architecture_graph: [
        'Client → API Gateway',
        'API Gateway → Auth Service',
        'API Gateway → User Service',
        'Auth Service → PostgreSQL',
        'Auth Service → Redis',
        'User Service → PostgreSQL',
        'User Service → Kafka',
        'Kafka → Notification Service',
        'Kafka → Analytics Service',
      ],
      architecture_observations: [
        'Clean microservices boundaries with single responsibility',
        'Event-driven async processing reduces coupling',
        'Missing service mesh (Istio/Linkerd) for mTLS between services',
        'Gateway is a potential single point of failure — consider multi-region',
        'No circuit breaker pattern implemented (recommend Resilience4j or Polly)',
      ],
    },
  }
}