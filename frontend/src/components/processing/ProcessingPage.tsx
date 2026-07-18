import React, { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, Cpu, Layers, Server, Shield,
  BookOpen, Network, Activity, FileSearch, FileCheck,
  CheckCircle2, Loader2, AlertCircle, Terminal, Zap,
  Sparkles, ArrowLeft, Brain, Github, Linkedin, Mail, ExternalLink, User
} from 'lucide-react'
import { useStore } from '../../store'
import { LuxuryBackground } from '../ui/luxury-background'
import { PageFooter } from '../ui/PageFooter'

// ─── Neural Palette ────────────────────────────────────────────────────────────
const PALETTE = {
  green:   '#86BC25',
  greenGlow: 'rgba(134,188,37,0.4)',
  cyan:    '#00E5FF',
  cyanGlow:'rgba(0,229,255,0.35)',
  violet:  '#A855F7',
  violetGlow:'rgba(168,85,247,0.35)',
  amber:   '#F59E0B',
  amberGlow:'rgba(245,158,11,0.35)',
  rose:    '#F43F5E',
  roseGlow:'rgba(244,63,94,0.35)',
  teal:    '#14B8A6',
  tealGlow:'rgba(20,184,166,0.35)',
}

// ─── Agent Configuration ───────────────────────────────────────────────────────
interface AgentConfig {
  id: string
  label: string
  desc: string
  icon: React.ReactNode
  color: string
  glow: string
  /** Angle in degrees on the neural ring. Central node (report) is separate. */
  angle: number
  ring: 'inner' | 'outer'
}

const AGENTS: AgentConfig[] = [
  { id: 'repo',  label: 'Repository Mapper',    desc: 'Topology scan',         icon: <GitBranch size={16}/>,  color: PALETTE.green,  glow: PALETTE.greenGlow,  angle: 0,   ring: 'outer' },
  { id: 'tech',  label: 'Tech Stack Agent',      desc: 'Framework analysis',    icon: <Cpu size={16}/>,        color: PALETTE.cyan,   glow: PALETTE.cyanGlow,   angle: 40,  ring: 'outer' },
  { id: 'dep',   label: 'Dependency Auditor',    desc: 'Package scanner',       icon: <Layers size={16}/>,     color: PALETTE.violet, glow: PALETTE.violetGlow, angle: 80,  ring: 'outer' },
  { id: 'infra', label: 'Infrastructure Agent',  desc: 'IaC discovery',         icon: <Server size={16}/>,     color: PALETTE.teal,   glow: PALETTE.tealGlow,   angle: 120, ring: 'outer' },
  { id: 'sec',   label: 'Security Auditor',      desc: 'Vulnerability check',   icon: <Shield size={16}/>,     color: PALETTE.rose,   glow: PALETTE.roseGlow,   angle: 160, ring: 'outer' },
  { id: 'doc',   label: 'Documentation Miner',   desc: 'Readme parser',         icon: <BookOpen size={16}/>,   color: PALETTE.amber,  glow: PALETTE.amberGlow,  angle: 200, ring: 'outer' },
  { id: 'arch',  label: 'Architecture Agent',    desc: 'Component modeler',     icon: <Network size={16}/>,    color: PALETTE.cyan,   glow: PALETTE.cyanGlow,   angle: 240, ring: 'outer' },
  { id: 'tele',  label: 'Telemetry Analyser',    desc: 'Trace gap detection',   icon: <Activity size={16}/>,   color: PALETTE.violet, glow: PALETTE.violetGlow, angle: 280, ring: 'outer' },
  { id: 'schem', label: 'Schematic Agent',       desc: 'API route mapper',      icon: <FileSearch size={16}/>, color: PALETTE.green,  glow: PALETTE.greenGlow,  angle: 320, ring: 'outer' },
  { id: 'report',label: 'Report Builder',        desc: 'Report consolidator',   icon: <FileCheck size={16}/>,  color: PALETTE.amber,  glow: PALETTE.amberGlow,  angle: 0,   ring: 'inner' },
]

const CONNECTIONS: [string, string][] = [
  ['repo','tech'],['tech','dep'],['dep','infra'],['infra','sec'],
  ['sec','doc'],['doc','arch'],['arch','tele'],['tele','schem'],
  ['schem','report'],['repo','report'],['tech','arch'],['dep','tele'],
  ['infra','report'],['sec','report'],
]

// ─── Neural coordinate helper ──────────────────────────────────────────────────
const OUTER_R = 200
const INNER_R = 0
const CX = 280
const CY = 280

function agentCoords(agent: AgentConfig): { x: number; y: number } {
  if (agent.ring === 'inner') return { x: CX, y: CY }
  const rad = (agent.angle - 90) * (Math.PI / 180)
  return { x: CX + OUTER_R * Math.cos(rad), y: CY + OUTER_R * Math.sin(rad) }
}

// ─── Live synaptic logs ────────────────────────────────────────────────────────
const LOG_TEMPLATES: Record<string, string[]> = {
  repo:   ['Initializing topology scan...','Cloning virtual directory model...','Mapping 247 source files...','Extracting metadata & ownership...'],
  tech:   ['Scanning package.json configs...','Detected TypeScript 5.x...','Express.js HTTP framework found.','Build tools identified.'],
  dep:    ['Scanning NPM dependencies...','Evaluating JWT, Redis, pg libs...','Mapping DB engine adapters...','Checking version compatibility.'],
  infra:  ['Scanning Dockerfile instructions...','Evaluating AWS EKS targets...','Inspecting GitHub Action workflows...','Terraform configs validated.'],
  sec:    ['Scanning credentials...','CRITICAL: Hardcoded DATABASE_URL.','HIGH: JWT Dev key committed.','SAST vulnerability analysis done.'],
  doc:    ['Parsing README docs...','Extracting docker-compose steps...','Aggregating config schema...','Documentation mining complete.'],
  arch:   ['Assembling logical topology...','Establishing gRPC boundaries...','Mapping API Gateway flows...','Blueprint validated.'],
  tele:   ['Inspecting telemetry config...','Logging via Winston confirmed.','OpenTelemetry tracing: MISSING.','Observability posture assembled.'],
  schem:  ['Tracing runtime API endpoints...','Mapping /api/v1 routes...','Validating OpenAPI specification...','Schema confirmed.'],
  report: ['Combining agent observations...','Compiling executive summary...','Writing DOCX output...','Report generation complete.'],
}

// ─── Synapse / Connection Line ─────────────────────────────────────────────────
function SynapseLine({
  from, to, status, fromColor
}: {
  from: AgentConfig; to: AgentConfig
  status: 'pending' | 'active' | 'completed'
  fromColor: string
}) {
  const fCoord = agentCoords(from)
  const tCoord = agentCoords(to)

  // Bezier control: offset toward center creates organic curve
  const ctrlX = (fCoord.x + tCoord.x) / 2 + (CX - (fCoord.x + tCoord.x) / 2) * 0.3
  const ctrlY = (fCoord.y + tCoord.y) / 2 + (CY - (fCoord.y + tCoord.y) / 2) * 0.3
  const d = `M${fCoord.x},${fCoord.y} Q${ctrlX},${ctrlY} ${tCoord.x},${tCoord.y}`

  const isActive = status === 'active'
  const isDone   = status === 'completed'

  return (
    <g>
      {/* Base dim line */}
      <path d={d} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1.5}/>

      {/* Glow trail */}
      {(isActive || isDone) && (
        <>
          {/* Fake glow layer (thick, transparent) */}
          <motion.path
            d={d} fill="none"
            stroke={fromColor}
            strokeWidth={isDone ? 4 : 6}
            strokeOpacity={isDone ? 0.15 : 0.25}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
          {/* Core layer */}
          <motion.path
            d={d} fill="none"
            stroke={fromColor}
            strokeWidth={isDone ? 1.5 : 2}
            strokeOpacity={isDone ? 0.5 : 0.9}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Travelling pulse particles */}
      {isActive && [0, 0.4, 0.7].map((delay, i) => (
        <motion.circle key={i} r={2.5} fill={fromColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay, duration: 2, repeat: Infinity }}
        >
          <animateMotion dur="2s" begin={`${delay}s`} repeatCount="indefinite" path={d} />
        </motion.circle>
      ))}
    </g>
  )
}

// ─── Neuron / Agent Node ───────────────────────────────────────────────────────
function NeuronNode({
  agent, status, onClick, selected
}: {
  agent: AgentConfig
  status: string
  onClick: () => void
  selected: boolean
}) {
  const { x, y } = agentCoords(agent)
  const isActive    = status === 'active'
  const isCompleted = status === 'completed'
  const isPending   = status === 'pending'
  const isCenter    = agent.ring === 'inner'
  const r = isCenter ? 38 : 28

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Outer pulse ring — active only */}
      {isActive && (
        <>
          <motion.circle cx={x} cy={y} r={r + 16} fill="none"
            stroke={agent.color} strokeWidth={1}
            style={{ opacity: 0.3 }}
            animate={{ r: [r + 14, r + 28], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.circle cx={x} cy={y} r={r + 8} fill="none"
            stroke={agent.color} strokeWidth={1.5}
            animate={{ r: [r + 6, r + 18], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />
        </>
      )}

      {/* Selected highlight ring */}
      {selected && !isActive && (
        <circle cx={x} cy={y} r={r + 8} fill="none"
          stroke={agent.color} strokeWidth={1} strokeOpacity={0.4}
          strokeDasharray="4 3"
        />
      )}

      {/* Node background */}
      <motion.circle cx={x} cy={y} r={r}
        fill={isCompleted ? `${agent.color}22` : isActive ? `${agent.color}33` : 'rgba(11,17,32,0.85)'}
        stroke={isPending ? 'rgba(255,255,255,0.08)' : agent.color}
        strokeWidth={isActive ? 2 : 1.5}
        strokeOpacity={isPending ? 1 : isCompleted ? 0.7 : 1}
        style={{ willChange: 'transform' }}
        animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />

      {/* Inner fill — completed glow */}
      {isCompleted && (
        <circle cx={x} cy={y} r={r * 0.6}
          fill={agent.color}
          fillOpacity={0.12}
        />
      )}

      {/* Icon foreign object */}
      <foreignObject x={x - 12} y={y - 12} width={24} height={24} style={{ pointerEvents: 'none' }}>
        <div style={{
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isPending ? 'rgba(255,255,255,0.25)' : agent.color,
          opacity: isPending ? 0.5 : 1,
        }}>
          {isCompleted
            ? <CheckCircle2 size={isCenter ? 20 : 16} />
            : isActive
              ? <Loader2 size={isCenter ? 20 : 16} className="animate-spin" />
              : agent.icon
          }
        </div>
      </foreignObject>

      {/* Label — shown below outer ring nodes, above for center */}
      {!isCenter && (
        <foreignObject
          x={x - 52} y={y + r + 6} width={104} height={36}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
              color: isPending ? 'rgba(255,255,255,0.25)' : isActive ? agent.color : 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
            }}>{agent.label}</div>
            {(isActive || selected) && (
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{agent.desc}</div>
            )}
          </div>
        </foreignObject>
      )}

      {/* Center label */}
      {isCenter && (
        <foreignObject x={x - 48} y={y + r + 8} width={96} height={24} style={{ pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: agent.color, textTransform: 'uppercase' }}>
            {isCompleted ? 'Complete' : isActive ? 'Compiling' : agent.label}
          </div>
        </foreignObject>
      )}
    </g>
  )
}

// ─── Neural Visualization Canvas ───────────────────────────────────────────────
function NeuralCanvas({
  agentSteps, selectedId, onSelect
}: {
  agentSteps: { id: string; status: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const completedCount = agentSteps.filter(s => s.status === 'completed').length
  const totalNodes = agentSteps.length

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Subtle radial grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 560 560" preserveAspectRatio="xMidYMid meet">
        {/* Rings */}
        {[80, 160, 240].map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r}
            fill="none" stroke="rgba(134,188,37,0.06)" strokeWidth={1} strokeDasharray="3 8"
          />
        ))}
        {/* Radial spokes */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30 - 90) * Math.PI / 180
          return (
            <line key={i}
              x1={CX} y1={CY}
              x2={CX + 260 * Math.cos(angle)} y2={CY + 260 * Math.sin(angle)}
              stroke="rgba(134,188,37,0.04)" strokeWidth={1}
            />
          )
        })}
      </svg>

      {/* Main neural SVG */}
      <svg viewBox="0 0 560 560" className="w-full h-full max-h-[560px]" style={{ overflow: 'visible' }}>
        <defs>
          {/* Radial gradient for center */}
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#86BC25" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#86BC25" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Center ambient glow */}
        <motion.circle cx={CX} cy={CY} r={80}
          fill="url(#center-glow)"
          animate={{ r: [75, 90, 75], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Synaptic connections */}
        {CONNECTIONS.map(([fromId, toId]) => {
          const fromAgent = AGENTS.find(a => a.id === fromId)!
          const toAgent   = AGENTS.find(a => a.id === toId)!
          const fromStep  = agentSteps.find(s => s.id === fromId)
          const toStep    = agentSteps.find(s => s.id === toId)
          const status =
            fromStep?.status === 'completed' && toStep?.status === 'active'  ? 'active'
            : fromStep?.status === 'completed' && toStep?.status === 'completed' ? 'completed'
            : 'pending'
          return (
            <SynapseLine key={`${fromId}-${toId}`}
              from={fromAgent} to={toAgent}
              status={status} fromColor={fromAgent.color}
            />
          )
        })}

        {/* Neuron nodes */}
        {AGENTS.map(agent => {
          const step = agentSteps.find(s => s.id === agent.id)
          return (
            <NeuronNode key={agent.id}
              agent={agent}
              status={step?.status || 'pending'}
              onClick={() => onSelect(agent.id)}
              selected={selectedId === agent.id}
            />
          )
        })}

        {/* Completion indicator arc */}
        <motion.circle
          cx={CX} cy={CY} r={OUTER_R + 36}
          fill="none"
          stroke="#86BC25"
          strokeWidth={2}
          strokeLinecap="round"
          strokeOpacity={0.6}
          strokeDasharray={`${2 * Math.PI * (OUTER_R + 36) * completedCount / totalNodes} ${2 * Math.PI * (OUTER_R + 36)}`}
          style={{ rotate: '-90deg', transformOrigin: `${CX}px ${CY}px`, willChange: 'transform' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

// ─── Terminal Panel ────────────────────────────────────────────────────────────
function TerminalPanel({ logs }: { logs: string[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [logs])

  return (
    <div className="bg-[#03060E]/95 border border-white/8 rounded-2xl flex flex-col overflow-hidden h-full relative"
      style={{ boxShadow: '0 0 0 1px rgba(134,188,37,0.08), inset 0 0 40px rgba(0,0,0,0.4)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60"/>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"/>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"/>
          </div>
          <Terminal size={11} className="text-discovery/70 ml-1"/>
          <span className="text-[10px] font-semibold text-text-muted tracking-wider uppercase">ADA Neural Console</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-text-subtle font-mono">{logs.length} events</span>
          <div className="flex items-center gap-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-discovery"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-[9px] text-discovery font-bold tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 font-mono text-[10.5px] leading-relaxed space-y-1 scroll-hidden">
        {logs.length === 0 ? (
          <div className="flex items-center gap-2 text-text-subtle/40 italic mt-2">
            <Sparkles size={10}/><span>Warming up neural pathways...</span>
          </div>
        ) : logs.map((log, i) => (
          <motion.div key={i} className="flex items-start gap-2"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className="text-text-subtle/50 shrink-0 select-none">›</span>
            <span className={
              log.includes('CRITICAL') ? 'text-rose-400' :
              log.includes('HIGH')     ? 'text-amber-400' :
              log.includes('complete') || log.includes('confirmed') ? 'text-discovery/90' :
              'text-text-secondary/70'
            }>
              {log.split('] ')[1] || log}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Scan line */}
      <motion.div className="absolute inset-x-0 h-px bg-discovery/8 pointer-events-none"
        animate={{ top: ['0%', '100%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────
function ProgressRing({ progress }: { progress: number }) {
  const r = 36; const circ = 2 * Math.PI * r
  return (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5}/>
        <motion.circle cx={40} cy={40} r={r} fill="none" stroke="#86BC25" strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - (progress / 100) * circ}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-bold text-text-primary">{progress}%</span>
        <span className="text-[8px] text-text-muted uppercase tracking-wider">Neural</span>
      </div>
    </div>
  )
}
// ─── Main Processing Page ──────────────────────────────────────────────────────
export function ProcessingPage() {
  const { repoUrl, agentSteps, analysisProgress, error, reset, setPage, logs } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const activeStep     = agentSteps.find(s => s.status === 'active')
  const completedCount = agentSteps.filter(s => s.status === 'completed').length
  const selectedAgent  = AGENTS.find(a => a.id === selectedId)
  const selectedStep   = agentSteps.find(s => s.id === selectedId)

  const handleBack = () => { reset(); setPage('landing') }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pt-20 sm:pt-24 bg-surface-base relative">
      <LuxuryBackground />

      {/* Page Header */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between mb-5 px-4 sm:px-6 gap-4 shrink-0 relative z-10"
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <motion.button onClick={handleBack}
            className="p-2 rounded-xl bg-surface-elevated border border-surface-border text-text-muted hover:text-text-primary hover:border-text-muted transition-all cursor-pointer shrink-0 mt-1 sm:mt-0"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={16}/>
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-discovery uppercase tracking-[0.2em] font-bold">Neural Pipeline Active</span>
              <motion.div className="w-2 h-2 rounded-full bg-discovery"
                animate={{ scale: [1,1.4,1], opacity: [1,0.4,1] }} transition={{ duration: 1.8, repeat: Infinity }}
              />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mt-0.5 tracking-tight">
              Multi-Agent Discovery
            </h2>
            <p className="text-[11px] text-text-muted font-mono truncate max-w-xs sm:max-w-md">{repoUrl}</p>
          </div>
        </div>

      </motion.div>

      {/* Scrollable Content Wrapper */}
      <div className="flex-grow overflow-y-auto px-4 sm:px-6 pb-8 scroll-hidden flex flex-col gap-6 relative z-10">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 shrink-0"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            >
            <div className="flex items-start gap-3">
              <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18}/>
              <div>
                <p className="text-sm font-semibold text-rose-400 mb-1">Pipeline Interrupted</p>
                <p className="text-xs text-text-secondary">{error}</p>
              </div>
            </div>
            <button onClick={handleBack} className="mt-3 btn-secondary px-3 py-1.5 text-xs cursor-pointer">← Back</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">

        {/* Neural Canvas — left 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 relative rounded-2xl overflow-hidden min-h-[420px]"
            style={{
              background: 'var(--canvas-bg)',
              border: '1px solid var(--canvas-border)',
              boxShadow: 'var(--canvas-shadow)',
            }}
          >
            {/* Ambient background dots */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Neural canvas */}
            <NeuralCanvas agentSteps={agentSteps} selectedId={selectedId} onSelect={setSelectedId}/>

            {/* Overlay tag */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/8"
              style={{ background: 'rgba(11,17,32,0.7)', backdropFilter: 'blur(12px)' }}
            >
              <Brain size={12} className="text-violet-400"/>
              <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase">Synaptic Network</span>
            </div>

            {/* Node count */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/8"
              style={{ background: 'rgba(11,17,32,0.7)', backdropFilter: 'blur(12px)' }}
            >
              <span className="text-[10px] font-bold text-discovery">{completedCount}</span>
              <span className="text-[10px] text-text-muted">/{agentSteps.length} neurons</span>
            </div>
          </div>

          {/* Agent legend row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 shrink-0">
            {AGENTS.filter(a => a.ring === 'outer').slice(0, 5).map(agent => {
              const step = agentSteps.find(s => s.id === agent.id)
              const st   = step?.status || 'pending'
              return (
                <motion.button key={agent.id}
                  onClick={() => setSelectedId(selectedId === agent.id ? null : agent.id)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl border cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: selectedId === agent.id ? agent.color + '60' : 'rgba(255,255,255,0.06)',
                    background: selectedId === agent.id ? agent.color + '12' : 'rgba(11,17,32,0.5)',
                  }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  <div style={{ color: st === 'pending' ? 'rgba(255,255,255,0.2)' : agent.color }}>
                    {st === 'completed' ? <CheckCircle2 size={11}/> : st === 'active' ? <Loader2 size={11} className="animate-spin"/> : agent.icon}
                  </div>
                  <span className="text-[9px] font-semibold truncate" style={{ color: st === 'pending' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)' }}>
                    {agent.label.split(' ')[0]}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Right panel — 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Active Agent card */}
          <motion.div className="rounded-2xl p-4 border shrink-0"
            style={{
              background: 'var(--card-bg)',
              borderColor: activeStep ? (AGENTS.find(a => a.id === activeStep.id)?.color + '40') : 'var(--card-border)',
              boxShadow: activeStep ? `0 0 30px ${AGENTS.find(a => a.id === activeStep.id)?.glow}` : 'var(--card-shadow)',
            }}
            layout
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap size={12} className="text-discovery"/>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Active Neuron</span>
            </div>
            <AnimatePresence mode="wait">
              {activeStep ? (
                <motion.div key={activeStep.id} className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                >
                  {(() => {
                    const ag = AGENTS.find(a => a.id === activeStep.id)!
                    return (
                      <>
                        <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: ag.color + '18', border: `1px solid ${ag.color}50` }}
                          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Loader2 size={18} className="animate-spin" style={{ color: ag.color }}/>
                        </motion.div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">{activeStep.label}</p>
                          <p className="text-[10px] text-text-muted truncate">{ag.desc}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: ag.color }}/>
                            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: ag.color }}>Processing</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </motion.div>
              ) : (
                <motion.div key="done" className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(134,188,37,0.12)', border: '1px solid rgba(134,188,37,0.35)' }}
                  >
                    <CheckCircle2 size={18} className="text-discovery"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">All neurons complete</p>
                    <p className="text-[10px] text-discovery animate-pulse">Generating final report...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Selected neuron detail */}
          <AnimatePresence>
            {selectedAgent && (
              <motion.div className="rounded-2xl p-4 border shrink-0"
                style={{
                  background: 'var(--card-bg)',
                  borderColor: selectedAgent.color + '30',
                  boxShadow: `0 0 20px ${selectedAgent.glow}`,
                }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                layout
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: selectedAgent.color }}>{selectedAgent.icon}</span>
                  <span className="text-xs font-bold text-text-primary">{selectedAgent.label}</span>
                  <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
                    style={{ background: selectedAgent.color + '18', color: selectedAgent.color }}
                  >
                    {selectedStep?.status || 'queued'}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted mb-2">{selectedAgent.desc}</p>
                {/* Mini signal bars */}
                <div className="flex items-end gap-1 h-6">
                  {Array.from({ length: 8 }, (_, i) => (
                    <motion.div key={i}
                      className="rounded-sm w-2"
                      style={{ background: selectedAgent.color, opacity: selectedStep?.status === 'pending' ? 0.12 : 0.7 }}
                      animate={selectedStep?.status === 'active' ? { height: [4 + i * 2, 8 + Math.random() * 10, 4 + i * 2] } : { height: 4 + i * 2 }}
                      transition={{ duration: 0.4, delay: i * 0.06, repeat: Infinity }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress stats */}
          <div className="rounded-2xl p-4 border shrink-0 relative z-10"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Synapse Progress</span>
              <span className="text-xs font-bold text-discovery">{completedCount}/{agentSteps.length}</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Circular Gauge */}
              <ProgressRing progress={analysisProgress}/>
              
              {/* Linear Details */}
              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #86BC25, #A855F7, #00E5FF)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Done', value: completedCount, color: '#86BC25' },
                    { label: 'Active', value: activeStep ? 1 : 0, color: '#00E5FF' },
                    { label: 'Queued', value: agentSteps.length - completedCount - (activeStep ? 1 : 0), color: '#A855F7' },
                  ].map(s => (
                    <div key={s.label} className="text-center py-1.5 rounded-xl border border-white/5"
                      style={{ background: s.color + '0C' }}
                    >
                      <div className="text-xs font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[8px] text-text-muted uppercase tracking-wider mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="h-56 w-full shrink-0 relative z-10">
            <TerminalPanel logs={logs}/>
          </div>
        </div>
      </div>

      {/* Footer */}
      <PageFooter/>
      </div>
    </div>
  )
}