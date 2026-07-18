import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { DiscoveryPayload, AgentStep, LLMProvider } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Page = 'landing' | 'processing' | 'results'

export interface Store {
  // Navigation
  currentPage: Page
  settingsOpen: boolean

  // Discovery state
  isRunning: boolean
  error: string | null
  payload: DiscoveryPayload | null
  reportPath: string | null
  repoUrl: string
  logs: string[]

  // LLM Provider Configuration
  activeProvider: string
  providers: Record<string, { apiKey: string; endpoint: string; enabled: boolean }>

  // Agent progress
  agentSteps: AgentStep[]
  currentStepIndex: number
  analysisProgress: number

  // Preferences
  reducedMotion: boolean

  // Recent repositories
  recentRepos: string[]

  // Actions — navigation
  setPage: (p: Page) => void
  toggleSettings: () => void

  // Actions — discovery
  setRepoUrl: (url: string) => void
  setRunning: (v: boolean) => void
  setError: (e: string | null) => void
  setResults: (payload: DiscoveryPayload, reportPath: string) => void

  // Actions — LLM Providers
  setActiveProvider: (id: string) => void
  setProviderKey: (id: string, key: string) => void
  setProviderEndpoint: (id: string, endpoint: string) => void
  toggleProvider: (id: string) => void
  getActiveProviderConfig: () => { apiKey: string; endpoint: string } | null

  // Actions — agent steps
  advanceStep: () => void
  completeAllSteps: () => void
  startStep: (id: string) => void
  completeStep: (id: string, logs?: string[]) => void
  setAnalysisProgress: (p: number) => void

  // Actions — logs
  addLog: (log: string) => void
  clearLogs: () => void

  // Actions — preferences
  setReducedMotion: (v: boolean) => void
  darkMode: boolean
  toggleDarkMode: () => void

  // Actions — misc
  addRecentRepo: (url: string) => void
  reset: () => void
}

// ─── Agent Steps ──────────────────────────────────────────────────────────────

const AGENT_STEPS: AgentStep[] = [
  { id: 'repo',   label: 'Repository Mapping Agent',     status: 'pending' },
  { id: 'tech',   label: 'Technology Discovery Agent',   status: 'pending' },
  { id: 'dep',    label: 'Dependency Auditor',           status: 'pending' },
  { id: 'infra',  label: 'Infrastructure Discovery',     status: 'pending' },
  { id: 'sec',    label: 'Security & Logging Auditor',   status: 'pending' },
  { id: 'doc',    label: 'Documentation Mining Agent',   status: 'pending' },
  { id: 'arch',   label: 'Architecture Blueprint Agent', status: 'pending' },
  { id: 'tele',   label: 'Telemetry Analysis Agent',    status: 'pending' },
  { id: 'schem',  label: 'Schematic Analysis Agent',    status: 'pending' },
  { id: 'report', label: 'Report Consolidation Agent',  status: 'pending' },
]

// ─── Default Provider Configs ─────────────────────────────────────────────────

const DEFAULT_PROVIDERS = {
  omniroute: {
    apiKey: localStorage.getItem('ada_provider_omniroute_key') || '',
    endpoint: localStorage.getItem('ada_provider_omniroute_endpoint') || 'https://api.omniroute.ai/v1',
    enabled: true,
  },
  gemini: {
    apiKey: localStorage.getItem('ada_provider_gemini_key') || '',
    endpoint: localStorage.getItem('ada_provider_gemini_endpoint') || 'https://generativelanguage.googleapis.com',
    enabled: false,
  },
  openai: {
    apiKey: localStorage.getItem('ada_provider_openai_key') || '',
    endpoint: localStorage.getItem('ada_provider_openai_endpoint') || 'https://api.openai.com/v1',
    enabled: false,
  },
  anthropic: {
    apiKey: localStorage.getItem('ada_provider_anthropic_key') || '',
    endpoint: localStorage.getItem('ada_provider_anthropic_endpoint') || 'https://api.anthropic.com',
    enabled: false,
  },
  azure: {
    apiKey: localStorage.getItem('ada_provider_azure_key') || '',
    endpoint: localStorage.getItem('ada_provider_azure_endpoint') || 'https://{resource}.openai.azure.com',
    enabled: false,
  },
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentPage: 'landing',
    settingsOpen: false,

    isRunning: false,
    error: null,
    payload: null,
    reportPath: null,
    repoUrl: '',
    logs: [],

    activeProvider: localStorage.getItem('ada_active_provider') || 'omniroute',
    providers: DEFAULT_PROVIDERS,

    agentSteps: AGENT_STEPS,
    currentStepIndex: -1,
    analysisProgress: 0,

    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    darkMode: true,

    recentRepos: [
      'https://github.com/vercel/next.js',
      'https://github.com/facebook/react',
    ],

    // Navigation
    setPage: (p) => set({ currentPage: p }),
    toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

    // Discovery actions
    setRepoUrl: (url) => set({ repoUrl: url }),
    setRunning: (v) => set({ isRunning: v }),
    setError: (e) => set({ error: e, isRunning: false }),
    setResults: (payload, reportPath) =>
      set({ payload, reportPath, isRunning: false, analysisProgress: 100, currentPage: 'results' }),

    // LLM Provider actions
    setActiveProvider: (id) => {
      localStorage.setItem('ada_active_provider', id)
      set({ activeProvider: id })
    },
    setProviderKey: (id, key) => {
      localStorage.setItem(`ada_provider_${id}_key`, key)
      set((s) => ({
        providers: {
          ...s.providers,
          [id]: { ...s.providers[id], apiKey: key },
        },
      }))
    },
    setProviderEndpoint: (id, endpoint) => {
      localStorage.setItem(`ada_provider_${id}_endpoint`, endpoint)
      set((s) => ({
        providers: {
          ...s.providers,
          [id]: { ...s.providers[id], endpoint },
        },
      }))
    },
    toggleProvider: (id) => {
      set((s) => {
        const newEnabled = !s.providers[id].enabled
        return {
          providers: {
            ...s.providers,
            [id]: { ...s.providers[id], enabled: newEnabled },
          },
        }
      })
    },
    getActiveProviderConfig: () => {
      const state = get()
      const provider = state.providers[state.activeProvider]
      if (!provider || !provider.enabled) return null
      return { apiKey: provider.apiKey, endpoint: provider.endpoint }
    },

    // Agent step actions
    advanceStep: () =>
      set((s) => {
        const idx = s.currentStepIndex + 1
        if (idx >= s.agentSteps.length) return s
        const steps = s.agentSteps.map((st, i) => ({
          ...st,
          status:
            i < idx  ? ('completed' as const)
            : i === idx ? ('active' as const)
            : ('pending' as const),
        }))
        const progress = Math.round(((idx + 1) / s.agentSteps.length) * 100)
        return { agentSteps: steps, currentStepIndex: idx, analysisProgress: progress }
      }),

    completeAllSteps: () =>
      set((s) => ({
        agentSteps: s.agentSteps.map((st) => ({ ...st, status: 'completed' as const })),
        currentStepIndex: s.agentSteps.length - 1,
        analysisProgress: 100,
      })),

    startStep: (id) =>
      set((s) => {
        const steps = s.agentSteps.map((st) => ({
          ...st,
          status:
            st.id === id
              ? ('active' as const)
              : st.status === 'active'
              ? ('completed' as const)
              : st.status,
        }))
        const idx = steps.findIndex((st) => st.id === id)
        const progress = idx !== -1 ? Math.round((idx / steps.length) * 100) : s.analysisProgress
        return { agentSteps: steps, currentStepIndex: idx, analysisProgress: progress }
      }),

    completeStep: (id, newLogs) =>
      set((s) => {
        const steps = s.agentSteps.map((st) =>
          st.id === id ? { ...st, status: 'completed' as const } : st
        )
        const idx = steps.findIndex((st) => st.id === id)
        const progress = idx !== -1 ? Math.round(((idx + 1) / steps.length) * 100) : s.analysisProgress
        
        let updatedLogs = s.logs
        if (newLogs && newLogs.length > 0) {
          const timestamp = new Date().toLocaleTimeString()
          updatedLogs = [...s.logs, ...newLogs.map((l) => `[${timestamp}] ${l}`)]
        }

        return {
          agentSteps: steps,
          currentStepIndex: idx,
          analysisProgress: progress,
          logs: updatedLogs,
        }
      }),

    setAnalysisProgress: (p) => set({ analysisProgress: p }),

    // Logs actions
    addLog: (log) => {
      const timestamp = new Date().toLocaleTimeString()
      set((s) => ({ logs: [...s.logs, `[${timestamp}] ${log}`] }))
    },

    clearLogs: () => set({ logs: [] }),

    // Preferences
    setReducedMotion: (v) => set({ reducedMotion: v }),
    toggleDarkMode: () => {},

    // Misc
    addRecentRepo: (url) =>
      set((s) => ({
        recentRepos: [url, ...s.recentRepos.filter((r) => r !== url)].slice(0, 5),
      })),

    reset: () =>
      set({
        isRunning: false,
        error: null,
        payload: null,
        reportPath: null,
        agentSteps: AGENT_STEPS.map(s => ({ ...s, status: 'pending' as const })),
        currentStepIndex: -1,
        analysisProgress: 0,
        logs: [],
        currentPage: 'landing',
      }),
  }))
)