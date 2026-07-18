import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Download, FileText, Shield, Database, Server,
  Activity, BookOpen, Network, Code2, CheckCircle2, AlertTriangle,
  ChevronRight, ExternalLink, Copy, Check, FolderPlus
} from 'lucide-react'
import { useStore } from '../../store'
import { PageFooter } from '../ui/PageFooter'
import { FadeSlide, ScaleIn, StaggerList } from '../motion'
import { ACCENTS, type AccentName } from '../../lib/accents'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { LuxuryBackground } from '../ui/luxury-background'

// ─── Tab Component ──────────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${active
          ? 'bg-discovery text-text-inverse shadow-glow-green-sm'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
        }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-surface-elevated'
          }`}>
          {count}
        </span>
      )}
    </motion.button>
  )
}

// ─── Section Card ───────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accent = 'discovery' }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: AccentName;
}) {
  const a = ACCENTS[accent]
  return (
    <motion.div
      className={`neo-card relative overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${a.bg}`} />
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg ${a.bg10} ${a.border} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

// ─── Risk Badge ─────────────────────────────────────────────────────────────────
function RiskBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    LOW: 'bg-green-500/10 text-green-400 border-green-500/20',
  }

  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${colors[severity] || colors.LOW}`}>
      {severity}
    </span>
  )
}

// ─── Copy Button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {copied ? <Check size={14} className="text-discovery" /> : <Copy size={14} />}
    </motion.button>
  )
}

// ─── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab({ payload }: { payload: any }) {
  const overview = payload?.application_overview
  if (!overview) return null

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <SectionCard title="Executive Summary" icon={<FileText size={16} className="text-discovery" />}>
        <p className="text-sm text-text-secondary leading-relaxed">{overview.executive_summary}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {Object.entries(overview.highlights || {}).map(([key, value]: [string, any]) => (
            <div key={key} className="p-3 rounded-xl bg-surface-elevated/50 border border-surface-border/30">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{key}</p>
              <p className="text-sm font-semibold text-text-primary">{value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Logical Components */}
      <SectionCard title="System Components" icon={<Network size={16} className="text-knowledge" />} accent="knowledge">
        <div className="space-y-2">
          {overview.logical_components?.map((comp: any, i: number) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/30 border border-surface-border/30 hover:border-surface-border/60 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-8 h-8 rounded-lg bg-knowledge/10 border border-knowledge/25 flex items-center justify-center shrink-0">
                <Code2 size={14} className="text-knowledge" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{comp.name}</p>
                <p className="text-[11px] text-text-muted">{comp.path}</p>
              </div>
              <p className="text-[11px] text-text-secondary hidden sm:block">{comp.role_purpose}</p>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Architecture Graph */}
      <SectionCard title="Architecture Graph" icon={<Network size={16} className="text-infra" />} accent="infra">
        <div className="p-4 rounded-xl bg-surface-elevated/30 border border-surface-border/30 font-mono text-xs space-y-1">
          {payload?.architecture_graph?.map((line: string, i: number) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 text-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <span className="text-discovery">→</span>
              <span>{line}</span>
            </motion.div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Tech Stack Tab ─────────────────────────────────────────────────────────────
function TechStackTab({ payload }: { payload: any }) {
  const stack = payload?.technology_stack
  if (!stack) return null

  return (
    <div className="space-y-6">
      <SectionCard title="Technology Stack" icon={<Code2 size={16} className="text-knowledge" />} accent="knowledge">
        <p className="text-sm text-text-secondary mb-4">{stack.stack_summary}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border/50">
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Layer</th>
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Technology</th>
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Version</th>
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Usage</th>
              </tr>
            </thead>
            <tbody>
              {stack.tech_stack_table?.map((entry: any, i: number) => (
                <motion.tr
                  key={i}
                  className="border-b border-surface-border/20 hover:bg-surface-elevated/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="py-2.5 px-3 text-text-primary font-medium">{entry.layer}</td>
                  <td className="py-2.5 px-3 text-text-secondary">{entry.technology}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-[11px] text-text-muted font-mono">
                      {entry.version}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary text-xs">{entry.usage}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ payload }: { payload: any }) {
  const security = payload?.security_observability
  if (!security) return null

  return (
    <div className="space-y-6">
      <SectionCard title="Security Assessment" icon={<Shield size={16} className="text-security" />} accent="security">
        <p className="text-sm text-text-secondary mb-4">{security.security_summary}</p>

        <div className="space-y-3">
          {security.security_risks?.map((risk: any, i: number) => (
            <motion.div
              key={i}
              className="p-4 rounded-xl bg-surface-elevated/30 border border-surface-border/30 hover:border-security/30 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <RiskBadge severity={risk.severity} />
                  <span className="text-xs font-mono text-text-muted">{risk.risk_id}</span>
                </div>
                <CopyButton text={risk.detail} />
              </div>
              <p className="text-sm text-text-primary mb-2">{risk.detail}</p>
              <div className="flex items-center gap-2 text-[11px] text-text-muted">
                <span className="font-mono">{risk.target}</span>
              </div>
              <div className="mt-2 p-2 rounded-lg bg-security/5 border border-security/10">
                <p className="text-[11px] text-security/80">
                  <span className="font-semibold">Mitigation: </span>
                  {risk.mitigation}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Auth Mechanisms" icon={<CheckCircle2 size={16} className="text-discovery" />}>
        <div className="flex flex-wrap gap-2">
          {security.auth_mechanisms?.map((auth: string, i: number) => (
            <span key={i} className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border/50 text-xs text-text-secondary">
              {auth}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Dependencies Tab ─────────────────────────────────────────────────────────
function DependenciesTab({ payload }: { payload: any }) {
  const deps = payload?.dependency_analysis
  if (!deps) return null

  return (
    <div className="space-y-6">
      <SectionCard title="Dependencies" icon={<Database size={16} className="text-infra" />} accent="infra">
        <p className="text-sm text-text-secondary mb-4">{deps.database_summary}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border/50">
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Package</th>
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Scope</th>
                <th className="text-left py-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {deps.dependency_table?.map((dep: any, i: number) => (
                <motion.tr
                  key={i}
                  className="border-b border-surface-border/20 hover:bg-surface-elevated/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-text-primary text-xs">{dep.package}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${dep.scope === 'prod' ? 'bg-discovery/10 text-discovery' : 'bg-knowledge/10 text-knowledge'
                      }`}>
                      {dep.scope}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary text-xs">{dep.purpose}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="External APIs" icon={<ExternalLink size={16} className="text-telemetry" />} accent="telemetry">
        <div className="flex flex-wrap gap-2">
          {deps.external_apis?.map((api: string, i: number) => (
            <span key={i} className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border/50 text-xs text-text-secondary">
              {api}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Infrastructure Tab ─────────────────────────────────────────────────────────
function InfrastructureTab({ payload }: { payload: any }) {
  const infra = payload?.infrastructure_insights
  if (!infra) return null

  return (
    <div className="space-y-6">
      <SectionCard title="Infrastructure" icon={<Server size={16} className="text-infra" />} accent="infra">
        <p className="text-sm text-text-secondary mb-4">{infra.infra_summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-elevated/30 border border-surface-border/30">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Cloud Services</p>
            <div className="flex flex-wrap gap-2">
              {infra.cloud_services?.map((service: string, i: number) => (
                <span key={i} className="px-2 py-1 rounded-md bg-infra/10 text-infra text-[11px] font-medium">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated/30 border border-surface-border/30">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Deployment Targets</p>
            <div className="space-y-1">
              {infra.deployment_targets?.map((target: string, i: number) => (
                <p key={i} className="text-xs text-text-secondary">{target}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-surface-elevated/30 border border-surface-border/30">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Containerization</p>
          <p className="text-xs text-text-secondary">{infra.containerization?.details}</p>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Telemetry Tab ────────────────────────────────────────────────────────────
function TelemetryTab({ payload }: { payload: any }) {
  const telemetry = payload?.telemetry_analysis
  if (!telemetry) return null

  // Try to match a score like "8/10", "8", or "8.5" at the start or anywhere in the string
  const rawScore = String(telemetry.observability_score || '')
  const scoreMatch = rawScore.match(/\b([0-9]+(\.[0-9]+)?(\s*\/\s*10)?)\b/)
  let scoreDisplay = '—'
  let scoreDetails = rawScore

  if (scoreMatch) {
    scoreDisplay = scoreMatch[0]
    if (!scoreDisplay.includes('/10')) {
      const parsedVal = parseFloat(scoreDisplay)
      if (!isNaN(parsedVal) && parsedVal <= 10) {
        scoreDisplay = `${scoreDisplay}/10`
      }
    }
    // Clean up details text by removing matched score from front if present
    const prefixStr = scoreMatch[0]
    if (rawScore.trim().startsWith(prefixStr)) {
      scoreDetails = rawScore.trim().substring(prefixStr.length).replace(/^[.\s,-]+/, '').trim()
    }
  } else {
    if (rawScore.length <= 8) {
      scoreDisplay = rawScore
      scoreDetails = ''
    } else {
      scoreDisplay = 'N/A'
      scoreDetails = rawScore
    }
  }


  return (
    <div className="space-y-6">
      <SectionCard title="Telemetry & Observability" icon={<Activity size={16} className="text-telemetry" />} accent="telemetry">
        
        {/* Main Score Details Card */}
        <div className="flex flex-col md:flex-row gap-6 p-5 rounded-2xl bg-surface-elevated/40 border border-surface-border mb-6">
          {/* Large Score Indicator */}
          <div className="flex flex-col items-center justify-center shrink-0 w-24 h-24 rounded-2xl bg-amber-500/5 border border-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.03)] px-2">
            <span className={`font-extrabold text-telemetry tracking-tight text-center truncate max-w-full leading-none ${
              scoreDisplay.length > 5 ? 'text-sm' : scoreDisplay.length > 3 ? 'text-lg' : 'text-2xl'
            }`}>
              {scoreDisplay || '—'}
            </span>
            <span className="text-[8px] text-telemetry/80 font-bold uppercase tracking-widest mt-1.5">Score</span>
          </div>

          
          {/* Explanation & Summary */}
          <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-telemetry" />
              <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Observability Posture</span>
            </div>
            {scoreDetails && (
              <p className="text-sm text-text-primary leading-relaxed font-semibold">
                {scoreDetails}
              </p>
            )}
            <p className="text-xs text-text-secondary leading-relaxed">
              {telemetry.telemetry_summary}
            </p>
          </div>
        </div>

        {/* Recommendations list */}
        {telemetry.recommendations && telemetry.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">Recommendations</h4>
            {telemetry.recommendations.map((rec: string, i: number) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-elevated/20 border border-surface-border/30"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AlertTriangle size={14} className="text-telemetry shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Documentation Tab ──────────────────────────────────────────────────────────
function DocumentationTab({ payload }: { payload: any }) {
  const docs = payload?.doc_analysis
  if (!docs) return null

  return (
    <div className="space-y-6">
      <SectionCard title="Documentation" icon={<BookOpen size={16} className="text-reports" />} accent="reports">
        <p className="text-sm text-text-secondary mb-4">{docs.doc_summary}</p>

        <div className="p-3 rounded-xl bg-surface-elevated/30 border border-surface-border/30">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Setup Instructions</p>
          <div className="space-y-1 font-mono text-xs">
            {docs.setup_instructions?.map((step: string, i: number) => (
              <motion.div
                key={i}
                className="flex items-center gap-2 text-text-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <span className="text-discovery">$</span>
                <span>{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Results Page ─────────────────────────────────────────────────────────
export function ResultsPage() {
  const { payload, reportPath, setPage, reset } = useStore()
  const [activeTab, setActiveTab] = useState('overview')

  if (!payload) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">No results available</p>
          <InteractiveHoverButton
            text="Start New Discovery"
            variant="primary"
            onClick={() => { reset(); setPage('landing') }}
          />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText size={14} />, count: undefined },
    { id: 'tech', label: 'Tech Stack', icon: <Code2 size={14} />, count: payload?.technology_stack?.tech_stack_table?.length },
    { id: 'security', label: 'Security', icon: <Shield size={14} />, count: payload?.security_observability?.security_risks?.length },
    { id: 'deps', label: 'Dependencies', icon: <Database size={14} />, count: payload?.dependency_analysis?.dependency_table?.length },
    { id: 'infra', label: 'Infrastructure', icon: <Server size={14} />, count: undefined },
    { id: 'telemetry', label: 'Telemetry', icon: <Activity size={14} />, count: undefined },
    { id: 'docs', label: 'Documentation', icon: <BookOpen size={14} />, count: undefined },
  ]

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab payload={payload} />
      case 'tech': return <TechStackTab payload={payload} />
      case 'security': return <SecurityTab payload={payload} />
      case 'deps': return <DependenciesTab payload={payload} />
      case 'infra': return <InfrastructureTab payload={payload} />
      case 'telemetry': return <TelemetryTab payload={payload} />
      case 'docs': return <DocumentationTab payload={payload} />
      default: return <OverviewTab payload={payload} />
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pt-20 sm:pt-24 bg-surface-base relative">
      <LuxuryBackground />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-surface-border/30">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <motion.button
            onClick={() => { reset(); setPage('landing'); }}
            className="p-2 rounded-xl bg-surface-elevated border border-surface-border text-text-muted hover:text-text-primary hover:border-text-muted transition-all cursor-pointer shrink-0 mt-1 sm:mt-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-discovery shrink-0" />
              <span className="text-metadata text-discovery uppercase tracking-widest font-semibold truncate">Discovery Complete</span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-heading font-bold text-text-primary mt-1 break-words leading-tight">
              {payload?.repo_name || 'Repository'} Analysis
            </h2>
          </div>
        </div>


        <div className="flex items-center gap-3 shrink-0">
          <InteractiveHoverButton
            text="Another Repo"
            icon={<FolderPlus size={14} />}
            variant="secondary"
            onClick={() => {
              reset()
              setPage('landing')
            }}
          />
          {reportPath && (
            <InteractiveHoverButton
              text="Download Report"
              icon={<Download size={14} />}
              variant="primary"
              onClick={() => {
                const a = document.createElement('a')
                a.href = reportPath
                a.download = ''
                a.click()
              }}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-6 py-3 border-b border-surface-border/30">
        <div className="flex gap-2 overflow-x-auto scroll-hidden">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
              count={tab.count}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 scroll-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
        
        <PageFooter />
      </div>
    </div>
  )
}