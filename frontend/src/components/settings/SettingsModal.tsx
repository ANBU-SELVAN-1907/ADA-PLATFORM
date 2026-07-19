import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Key, Settings, Route, Sparkles, Brain, MessageSquare, Cloud, 
  Check, Eye, EyeOff, ExternalLink, Info, AlertTriangle, Save
} from 'lucide-react'
import { useStore } from '../../store'
import { LLM_PROVIDERS } from '../../types'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

// ─── Provider Card Component ────────────────────────────────────────────────────
function ProviderCard({ 
  provider, 
  isActive, 
  isEnabled, 
  apiKey, 
  endpoint,
  customModel = '',
  onActivate, 
  onToggle,
  onKeyChange,
  onEndpointChange,
  onModelChange
}: {
  provider: typeof LLM_PROVIDERS[0]
  isActive: boolean
  isEnabled: boolean
  apiKey: string
  endpoint: string
  customModel?: string
  onActivate: () => void
  onToggle: () => void
  onKeyChange: (key: string) => void
  onEndpointChange: (endpoint: string) => void
  onModelChange: (model: string) => void
}) {
  const [showKey, setShowKey] = useState(false)
  const [isExpanded, setIsExpanded] = useState(isActive)

  const icons: Record<string, React.ReactNode> = {
    route: <Route size={18} />,
    sparkles: <Sparkles size={18} />,
    brain: <Brain size={18} />,
    'message-square': <MessageSquare size={18} />,
    cloud: <Cloud size={18} />,
  }

  return (
    <motion.div
      className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
        isActive 
          ? 'bg-surface-card/80 border-discovery/40 shadow-[0_0_20px_rgba(134,188,37,0.1)]' 
          : 'bg-surface-card/40 border-surface-border/50 hover:border-surface-border/80'
      }`}
      layout
    >
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Icon */}
        <div 
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isActive 
              ? 'bg-discovery/15 text-discovery border border-discovery/30' 
              : 'bg-surface-elevated text-text-muted border border-surface-border'
          }`}
        >
          {icons[provider.icon] || <Sparkles size={18} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
              {provider.name}
            </span>
            {isActive && (
              <span className="px-1.5 py-0.5 rounded-md bg-discovery/15 text-discovery text-[10px] font-bold uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-muted truncate">{provider.description}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className={`relative w-10 h-6 rounded-full transition-all duration-300 ${
            isEnabled ? 'bg-discovery' : 'bg-surface-border'
          }`}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
            animate={{ left: isEnabled ? '18px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && isEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-surface-border/30"
          >
            <div className="p-4 space-y-4">
              {/* Info note for AWS Bedrock native authentication */}
              {provider.id === 'bedrock' && (
                <div className="rounded-xl bg-discovery/10 border border-discovery/20 p-3 text-xs text-text-secondary flex items-start gap-2">
                  <Info size={16} className="text-discovery shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-text-primary">IAM Role Authentication:</span> This provider uses your AWS Fargate container task role. No API key is required when running in your AWS environment.
                  </div>
                </div>
              )}

              {/* API Key Input - Hidden for Bedrock */}
              {provider.id !== 'bedrock' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={11} />
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => onKeyChange(e.target.value)}
                      placeholder={`Enter ${provider.name} API key...`}
                      className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-discovery focus:ring-2 focus:ring-discovery/20 transition-all pr-10"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Endpoint Input / Region input for Bedrock */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink size={11} />
                  {provider.id === 'bedrock' ? 'AWS Region (Optional)' : 'Endpoint URL'}
                </label>
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => onEndpointChange(e.target.value)}
                  placeholder={provider.id === 'bedrock' ? 'e.g. us-east-1' : (provider.defaultEndpoint || 'https://api.example.com')}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-discovery focus:ring-2 focus:ring-discovery/20 transition-all"
                />
              </div>

              {/* Model Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Brain size={11} />
                  Model ID / Name
                </label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  placeholder={provider.id === 'bedrock' ? 'e.g. anthropic.claude-3-5-sonnet-20241022-v2:0' : 'e.g. auto/best-free'}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-discovery focus:ring-2 focus:ring-discovery/20 transition-all"
                />
              </div>

              {/* Activate Button */}
              {!isActive && (
                <InteractiveHoverButton
                  text="Set as Active Provider"
                  icon={<Check size={14} />}
                  variant="primary"
                  onClick={onActivate}
                  className="w-full justify-center"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Settings Tab Component ─────────────────────────────────────────────────────
function SettingsTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-discovery text-text-inverse shadow-glow-green-sm' 
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Main Settings Modal ────────────────────────────────────────────────────────
export function SettingsModal() {
  const { 
    settingsOpen, 
    toggleSettings, 
    activeProvider, 
    providers,
    setActiveProvider,
    setProviderKey,
    setProviderEndpoint,
    setProviderModel,
    toggleProvider,
    reducedMotion,
    setReducedMotion,
  } = useStore()

  const [activeTab, setActiveTab] = useState<'llm' | 'general'>('llm')

  if (!settingsOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-surface-overlay backdrop-blur-sm"
          onClick={toggleSettings}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl max-h-[85vh] bg-surface-modal border border-surface-border rounded-3xl shadow-modal overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-discovery/10 border border-discovery/30 flex items-center justify-center">
                <Settings size={18} className="text-discovery" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Settings</h2>
                <p className="text-[11px] text-text-muted">Configure your discovery environment</p>
              </div>
            </div>
            <motion.button
              onClick={toggleSettings}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={18} />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-6 py-3 border-b border-surface-border/30">
            <SettingsTab
              active={activeTab === 'llm'}
              onClick={() => setActiveTab('llm')}
              icon={<Sparkles size={14} />}
              label="LLM Providers"
            />
            <SettingsTab
              active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
              icon={<Settings size={14} />}
              label="General"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scroll-hidden">
            {activeTab === 'llm' ? (
              <div className="space-y-6">
                {/* Info banner */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-knowledge/5 border border-knowledge/20">
                  <Info size={16} className="text-knowledge shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-text-primary font-medium">LLM Provider Configuration</p>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Configure multiple LLM providers and switch between them seamlessly. 
                      OmniRoute is the default enterprise routing layer. Add your own API keys 
                      for Gemini, OpenAI, Anthropic, or Azure OpenAI to use them directly.
                    </p>
                  </div>
                </div>

                {/* Provider cards */}
                <div className="space-y-3">
                  {LLM_PROVIDERS.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isActive={activeProvider === provider.id}
                      isEnabled={providers[provider.id]?.enabled || false}
                      apiKey={providers[provider.id]?.apiKey || ''}
                      endpoint={providers[provider.id]?.endpoint || provider.defaultEndpoint || ''}
                      customModel={providers[provider.id]?.customModel || ''}
                      onActivate={() => setActiveProvider(provider.id)}
                      onToggle={() => toggleProvider(provider.id)}
                      onKeyChange={(key) => setProviderKey(provider.id, key)}
                      onEndpointChange={(endpoint) => setProviderEndpoint(provider.id, endpoint)}
                      onModelChange={(model) => setProviderModel(provider.id, model)}
                    />
                  ))}
                </div>

                {/* Warning for no active provider */}
                {!providers[activeProvider]?.enabled && (
                  <motion.div
                    className="flex items-start gap-3 p-3 rounded-xl bg-security/5 border border-security/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertTriangle size={16} className="text-security shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-security font-medium">No Active Provider</p>
                      <p className="text-[11px] text-text-secondary mt-1">
                        Please enable and activate at least one LLM provider to use the discovery features.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* General settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-card/40 border border-surface-border/50">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Reduced Motion</p>
                      <p className="text-[11px] text-text-muted mt-1">Disable animations for accessibility</p>
                    </div>
                    <button
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                        reducedMotion ? 'bg-discovery' : 'bg-surface-border'
                      }`}
                    >
                      <motion.div
                        className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                        animate={{ left: reducedMotion ? '22px' : '2px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-card/40 border border-surface-border/50">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</p>
                      <p className="text-[11px] text-text-muted mt-1">Enable keyboard navigation</p>
                    </div>
                    <div className="flex gap-1">
                      <span className="px-2 py-1 rounded-md bg-surface-elevated border border-surface-border text-[10px] text-text-muted font-mono">Cmd + K</span>
                      <span className="text-text-muted">Focus</span>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="p-4 rounded-xl bg-surface-card/40 border border-surface-border/50">
                  <p className="text-sm font-semibold text-text-primary mb-2">About</p>
                  <div className="text-[10px] text-text-subtle font-mono text-center flex flex-col gap-1 opacity-60">
                    <p>ADA — Application Discovery Agent v3.0.0</p>
                    <p className="text-discovery">© 2026 ADA</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border/50">
            <button
              onClick={toggleSettings}
              className="btn-secondary px-4 py-2 text-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}