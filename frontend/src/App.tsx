import React from 'react'
import { useStore } from './store'
import { MotionProvider, PageTransition } from './components/motion'
import { LandingPage } from './components/landing/LandingPage'
import { ProcessingPage } from './components/processing/ProcessingPage'
import { ResultsPage } from './components/results/ResultsPage'
import { TopNav } from './components/nav/TopNav'
import { SettingsModal } from './components/settings/SettingsModal'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { discover, streamDiscovery, getMockResponse } from './api/client'

export default function App() {
  const {
    currentPage,
    setPage,
    setRunning,
    setError,
    setResults,
    addRecentRepo,
    agentSteps,
    advanceStep,
    completeAllSteps,
    getActiveProviderConfig,
    providers,
    startStep,
    completeStep,
    addLog,
    clearLogs,
    activeProvider,
  } = useStore()

  useKeyboardShortcuts()

  const handleStartDiscovery = async (url: string) => {
    if (!url.trim()) return

    // Check if any provider is enabled
    const hasEnabledProvider = Object.values(providers).some((p) => p.enabled)
    if (!hasEnabledProvider) {
      setError('No LLM provider is enabled. Please configure at least one provider in Settings.')
      setPage('processing')
      return
    }

    const providerConfig = getActiveProviderConfig()
    if (!providerConfig) {
      setError('Active provider is not configured. Please check your provider settings.')
      setPage('processing')
      return
    }

    setRunning(true)
    setError(null)
    addRecentRepo(url.trim())
    setPage('processing')

    // Read locally stored credentials
    const githubToken = localStorage.getItem('ada_github_token') || ''
    
    // Clear logs and print startup status
    clearLogs()
    addLog(`Initiating codebase analysis for ${url.trim()}...`)
    addLog('Establishing connection to multi-agent discovery orchestration server...')

    try {
      streamDiscovery({
        repo_url: url.trim(),
        github_token: githubToken || null,
        omniroute_key: providers.omniroute?.apiKey || null,
        gemini_key: providers.gemini?.apiKey || null,
        openai_key: providers.openai?.apiKey || null,
        active_provider: activeProvider,
        format: 'docx',
      }, {
        onAgentStart: (agentId) => {
          startStep(agentId)
          addLog(`Deploying ${agentId.toUpperCase()} agent to analyze codebase structure...`)
        },
        onAgentComplete: (agentId, logs) => {
          completeStep(agentId, logs)
        },
        onComplete: (result) => {
          completeAllSteps()
          setResults(result.payload, result.report_path)
        },
        onError: (err) => {
          const msg = err.message || String(err)
          if (msg.includes('Missing required API key') || msg.includes('400') || msg.includes('401')) {
            setError(
              'API key error. Open Settings (⚙) and verify your API key for the active provider, ' +
              'then try again. Alternatively press "Try Demo" to see the UI with mock data.'
            )
          } else {
            setError(msg || 'Discovery failed. Check that the backend server is running.')
          }
        }
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Discovery failed. Check that the backend server is running.')
    }
  }

  // Called explicitly from "Try Demo" button — bypasses real API
  const handleRunDemo = (url: string) => {
    useStore.getState().reset()
    setRunning(true)
    setPage('processing')

    const demoLogs: Record<string, string[]> = {
      repo: ['Starting topology scanning...', 'Scanned 247 source files.', 'Extracted package manifests.'],
      tech: ['Parsing runtime configurations...', 'Detected language: TypeScript 5.6', 'Detected framework: React 18 & Express.js'],
      dep: ['Scanning third-party dependencies...', 'Database adapters: pg, ioredis', 'External integrations: Stripe, Twilio'],
      infra: ['Scanning Dockerfiles & configurations...', 'Deployment target: Kubernetes (AWS EKS)', 'Continuous Integration: GitHub Actions workflow'],
      sec: ['Running security check...', 'WARNING: Hardcoded DATABASE_URL in config/database.js', 'Recommendation: Move credentials to environment variables'],
      doc: ['Reading README.md...', 'Setup instruction parser complete.'],
      arch: ['Modeling logical components topology...', 'Component mapping: API Gateway -> Auth, User services', 'System model validated.'],
      tele: ['Auditing logging frameworks...', 'Observability metric tools: Winston, Datadog', 'Diagnostic: OpenTelemetry tracing missing.'],
      schem: ['Mapping endpoint route specifications...', 'Catalogued endpoints: /api/v1/auth/login, /api/v1/users'],
      report: ['Finalizing audit package...', 'Writing report files in DOCX format...', 'Report consolidation complete.'],
    }

    let stepIdx = 0
    const totalSteps = agentSteps.length
    const stepsList = agentSteps.map(s => s.id)

    // Clear logs initially
    clearLogs()
    addLog('Initializing virtual sandbox environment...')

    // Start first step
    startStep(stepsList[0])
    demoLogs[stepsList[0]]?.forEach(log => addLog(log))

    const stepTimer = setInterval(() => {
      if (stepIdx < totalSteps - 1) {
        const currentId = stepsList[stepIdx]
        const nextId = stepsList[stepIdx + 1]
        
        completeStep(currentId)
        startStep(nextId)
        demoLogs[nextId]?.forEach(log => addLog(log))
        
        stepIdx++
      } else {
        clearInterval(stepTimer)
      }
    }, 2400)

    setTimeout(() => {
      clearInterval(stepTimer)
      completeAllSteps()
      const mockData = getMockResponse()
      setResults(mockData.payload, mockData.report_path)
    }, totalSteps * 2400 + 500)
  }

  return (
    <MotionProvider>
      <div className="relative h-screen w-full flex flex-col text-text-primary bg-surface font-sans overflow-hidden">
        <TopNav />

        <div className="flex-1 h-full overflow-hidden relative">
          <PageTransition workspaceKey={currentPage}>
            {currentPage === 'landing' && (
              <LandingPage
                onStartDiscovery={handleStartDiscovery}
                onRunDemo={handleRunDemo}
              />
            )}
            {currentPage === 'processing' && <ProcessingPage />}
            {currentPage === 'results' && <ResultsPage />}
          </PageTransition>
        </div>

        <SettingsModal />
      </div>
    </MotionProvider>
  )
}