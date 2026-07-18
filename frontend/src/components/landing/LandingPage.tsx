import React, { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowRight, Github, Zap, GitBranch, Cpu, Settings, ShieldAlert, Layers, Sparkles, Code2, Globe, Terminal, ChevronRight, Star, Activity, Database, Lock } from 'lucide-react'
import { useStore } from '../../store'
import { FadeSlide, ScaleIn, StaggerList, ParticleField, GlowText, MagneticButton, ScrollReveal } from '../motion'
import { ACCENTS, ACCENT_HEX, type AccentName } from '../../lib/accents'
import NeuralBackground from '@/components/ui/flow-field-background'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { PageFooter } from '../ui/PageFooter'

// ─── Ultra Premium Ambient Background ─────────────────────────────────────────
function AmbientBackground() {
  const { reducedMotion } = useStore()
  if (reducedMotion) return <div className="fixed inset-0 bg-[#060a12] z-0" />

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#060a12] z-0 select-none pointer-events-none">
      {/* Flow Field particle background — base layer */}
      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        <NeuralBackground
          color="#86bc25"
          trailOpacity={0.08}
          particleCount={500}
          speed={0.6}
          className="!bg-transparent"
        />
      </div>

      {/* Animated grid with depth */}
      <div
        className="absolute inset-0 grid-bg-sm opacity-[0.06] mix-blend-screen"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 70%)'
        }}
      />

      {/* Second grid layer for parallax depth */}
      <div
        className="absolute inset-0 grid-bg-lg opacity-[0.04] mix-blend-screen"
        style={{
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 80%)',
          transform: 'scale(1.5)'
        }}
      />

      {/* Deloitte Green Orb - primary */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.15]"
        style={{
          background: 'radial-gradient(circle, rgba(134,188,37,0.5) 0%, transparent 70%)',
          willChange: 'transform',
          left: '5%',
          top: '10%',
        }}
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, -60, 40, -30, 0],
          scale: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Knowledge Blue Orb - secondary */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, rgba(0,163,224,0.5) 0%, transparent 70%)',
          willChange: 'transform',
          right: '0%',
          bottom: '5%',
        }}
        animate={{
          x: [0, -60, 50, -80, 0],
          y: [0, 40, -50, 30, 0],
          scale: [1, 0.95, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
      />

      {/* Purple accent orb */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.1]"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)',
          willChange: 'transform',
          left: '60%',
          top: '60%',
        }}
        animate={{
          x: [0, -40, 30, -50, 0],
          y: [0, -30, 50, -20, 0],
          scale: [1, 1.15, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 10,
        }}
      />

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-discovery/20 to-transparent"
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Floating particles */}
      <ParticleField count={20} />
    </div>
  )
}

// ─── 3D Floating Agent Cards ──────────────────────────────────────────────────
function FloatingAgentCards() {
  const { reducedMotion } = useStore()
  if (reducedMotion) return null

  const cards: { icon: React.ReactNode; label: string; accent: AccentName; delay: number; left: string; top: string }[] = [
    { icon: <GitBranch size={18} />, label: 'Repo Mapper', accent: 'discovery', delay: 0, left: '8%', top: '25%' },
    { icon: <Cpu size={18} />, label: 'Tech Agent', accent: 'knowledge', delay: 0.5, left: '10%', top: '65%' },
    { icon: <ShieldAlert size={18} />, label: 'Security', accent: 'security', delay: 1, left: '82%', top: '22%' },
    { icon: <Database size={18} />, label: 'Infra Scanner', accent: 'infra', delay: 1.5, left: '84%', top: '65%' },
    { icon: <Activity size={18} />, label: 'Telemetry', accent: 'telemetry', delay: 2, left: '76%', top: '42%' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] hidden xl:block">
      {cards.map((card, i) => {
        const a = ACCENTS[card.accent]
        return (
          <motion.div
            key={card.label}
            className={`absolute flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-card/80 border ${a.border} backdrop-blur-sm`}
            style={{
              left: card.left,
              top: card.top,
            }}
            animate={{
              y: [0, -15, 0, 15, 0],
              x: [0, 8, 0, -8, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: card.delay,
            }}
          >
            <div className={a.text}>{card.icon}</div>
            <span className="text-[10px] font-medium text-text-secondary">{card.label}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Repository Input Component ─────────────────────────────────────────────────
function RepoInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const { toggleSettings } = useStore()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const examples = [
    'https://github.com/vercel/next.js',
    'https://github.com/facebook/react',
    'https://github.com/microsoft/TypeScript',
    'https://github.com/tailwindlabs/tailwindcss',
  ]
  const [exampleIdx, setExampleIdx] = useState(0)

  useEffect(() => {
    if (focused) return
    const id = setInterval(() => {
      setExampleIdx((i) => (i + 1) % examples.length)
    }, 3000)
    return () => clearInterval(id)
  }, [focused, examples.length])

  return (
    <div className="w-full max-w-2xl px-2 sm:px-0 z-10">
      <motion.div
        className={`relative flex items-center rounded-2xl border transition-all duration-500 ${focused
          ? 'border-discovery shadow-[0_0_30px_rgba(134,188,37,0.15)] bg-surface-floating'
          : 'border-surface-border bg-surface-elevated/50 backdrop-blur-md'
          }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Animated border glow on focus */}
        {focused && (
          <motion.div
            className="absolute -inset-[1px] rounded-2xl opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(134,188,37,0.3), rgba(0,163,224,0.3), rgba(139,92,246,0.3))',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        <div className="relative flex items-center pl-4 pr-2 text-text-muted shrink-0">
          <Github size={18} />
        </div>
        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onSubmit(value.trim())}
          placeholder={examples[exampleIdx]}
          className="relative flex-1 min-w-0 bg-transparent text-text-primary text-sm sm:text-body py-4 outline-none placeholder:text-text-muted/60 z-10"
          aria-label="GitHub repository URL"
          id="repo-url-input"
        />
        <div className="relative pr-2 shrink-0 flex items-center gap-2 z-10">
          {/* Settings key config quick access */}
          <motion.button
            onClick={toggleSettings}
            className="p-2.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            title="Configure Credentials (Cmd+,)"
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings size={16} />
          </motion.button>

          <InteractiveHoverButton
            text="Discover"
            icon={<Zap size={14} />}
            variant="primary"
            id="start-discovery-btn"
            disabled={!value.trim()}
            aria-label="Start discovery analysis"
            onClick={() => value.trim() && onSubmit(value.trim())}
            className="whitespace-nowrap"
          />
        </div>
      </motion.div>

      <motion.p
        className="mt-3 text-center text-xs text-text-muted/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Supports public repositories. Configure private repo credentials in{' '}
        <button onClick={toggleSettings} className="text-discovery hover:text-ada-green-light underline underline-offset-2 cursor-pointer transition-colors">
          Settings
        </button>
      </motion.p>
    </div>
  )
}

// ─── Stats Counter ────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { label: 'Agents', value: '10', suffix: '', icon: <Cpu size={14} /> },
    { label: 'Files Scanned', value: '50K+', suffix: '', icon: <Code2 size={14} /> },
    { label: 'Repositories', value: '1.2K', suffix: '+', icon: <Globe size={14} /> },
    { label: 'Accuracy', value: '99.7', suffix: '%', icon: <Star size={14} /> },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-8 mt-12">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="flex items-center gap-2 text-text-muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
        >
          <div className="text-discovery/60">{stat.icon}</div>
          <span className="text-sm font-semibold text-text-primary">{stat.value}{stat.suffix}</span>
          <span className="text-xs">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Features Config ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <GitBranch size={22} className="text-discovery" />,
    title: 'Codebase Mapping',
    desc: 'Perform file topology analysis and trace code architecture layouts with surgical precision.',
    accent: 'discovery',
    gradient: 'from-discovery/20 to-discovery/5',
  },
  {
    icon: <Cpu size={22} className="text-knowledge" />,
    title: 'Autonomous Agents',
    desc: 'Deploy 10 parallel AI agents mapping packages, infrastructure, and configuration in real-time.',
    accent: 'knowledge',
    gradient: 'from-knowledge/20 to-knowledge/5',
  },
  {
    icon: <Zap size={22} className="text-infra" />,
    title: 'Executive Intelligence',
    desc: 'Generate downloadable compliance audit packages with executive summaries in minutes.',
    accent: 'infra',
    gradient: 'from-infra/20 to-infra/5',
  },
  {
    icon: <ShieldAlert size={22} className="text-security" />,
    title: 'Security Audit',
    desc: 'Detect hardcoded secrets, vulnerable dependencies, and misconfigurations automatically.',
    accent: 'security',
    gradient: 'from-security/20 to-security/5',
  },
  {
    icon: <Activity size={22} className="text-telemetry" />,
    title: 'Telemetry Analysis',
    desc: 'Evaluate observability posture, logging frameworks, and distributed tracing coverage.',
    accent: 'telemetry',
    gradient: 'from-telemetry/20 to-telemetry/5',
  },
  {
    icon: <Database size={22} className="text-reports" />,
    title: 'Architecture Graph',
    desc: 'Visualize service dependencies, data flows, and API surface areas interactively.',
    accent: 'reports',
    gradient: 'from-reports/20 to-reports/5',
  },
]

// ─── Main Landing Page ─────────────────────────────────────────────────────────
interface LandingPageProps {
  onStartDiscovery: (repoUrl: string) => void
  onRunDemo: (url: string) => void
}

export function LandingPage({ onStartDiscovery, onRunDemo }: LandingPageProps) {
  const setRepoUrl = useStore((s) => s.setRepoUrl)
  const toggleSettings = useStore((s) => s.toggleSettings)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const rawOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const y = useSpring(rawY, { stiffness: 80, damping: 20, mass: 0.4 })
  const opacity = useSpring(rawOpacity, { stiffness: 80, damping: 20, mass: 0.4 })

  const handleSubmit = (url: string) => {
    setRepoUrl(url)
    onStartDiscovery(url)
  }

  const handleDemo = () => {
    const demoUrl = 'https://github.com/vercel/next.js'
    setRepoUrl(demoUrl)
    onRunDemo(demoUrl)
  }

  return (
    <div ref={containerRef} className="relative flex-grow h-full flex flex-col overflow-y-auto overflow-x-hidden bg-transparent w-full scroll-smooth">
      {/* Ultra premium background elements */}
      <AmbientBackground />
      <FloatingAgentCards />

      {/* Hero content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-28 sm:pt-36 pb-12 text-center max-w-5xl mx-auto w-full">
        <motion.div style={{ y, opacity, willChange: 'transform, opacity' }} className="w-full flex flex-col items-center">
          <FadeSlide delay={0.1}>
            <div className="flex items-center gap-2 mb-6 justify-center">
              <motion.div
                className="w-2 h-2 rounded-full bg-discovery"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-[11px] text-discovery font-bold tracking-[0.2em] uppercase">
                Application Discovery Agent Platform
              </span>
              <motion.div
                className="w-2 h-2 rounded-full bg-discovery"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </div>
          </FadeSlide>

          <FadeSlide delay={0.2}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              <span className="text-gradient-white">Automate codebase</span>
              <br />
              <span className="text-gradient-green">architecture discovery</span>
            </h1>
          </FadeSlide>

          <FadeSlide delay={0.3}>
            <p className="text-caption sm:text-body text-text-secondary max-w-2xl mb-10 leading-relaxed">
              ADA parses code patterns, logical endpoints, dependencies, and security postures,
              compiling instant compliance reports and logical topology blueprints with
              <span className="text-text-primary font-medium"> enterprise-grade precision</span>.
            </p>
          </FadeSlide>

          {/* Input form */}
          <FadeSlide delay={0.4} className="w-full flex justify-center">
            <RepoInput onSubmit={handleSubmit} />
          </FadeSlide>

          {/* Stats */}
          <StatsBar />
        </motion.div>

        {/* Highlight features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={0.1 * i}>
              <motion.div
                className={`neo-card text-left group cursor-pointer relative overflow-hidden`}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`w-11 h-11 rounded-xl ${ACCENTS[f.accent as AccentName].bg10} border ${ACCENTS[f.accent as AccentName].border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-caption font-bold text-text-primary mb-2">{f.title}</h3>
                  <p className="text-metadata text-text-secondary leading-relaxed">{f.desc}</p>
                </div>

                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-16 h-16 ${ACCENTS[f.accent as AccentName].bg5} rounded-bl-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Quick launch mock button */}
        <FadeSlide delay={0.8} className="mt-14">
          <motion.button
            className="flex items-center gap-2 text-sm text-discovery hover:text-ada-green-light transition-colors cursor-pointer group"
            onClick={handleDemo}
            id="try-demo-btn"
            whileHover={{ x: 5 }}
          >
            <span className="w-8 h-8 rounded-full bg-discovery/10 flex items-center justify-center group-hover:bg-discovery/20 transition-colors">
              <ArrowRight size={14} />
            </span>
            <span>Try with mock demo data (no API key needed)</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </FadeSlide>
      </main>

      {/* Page End Footer Card */}
      <div className="px-6 relative z-10">
        <PageFooter />
      </div>
    </div>
  )
}