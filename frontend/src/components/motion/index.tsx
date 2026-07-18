import React from 'react'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'

// ─── MotionProvider ───────────────────────────────────────────────────────────

interface MotionContextValue {
  reducedMotion: boolean
}

const MotionContext = React.createContext<MotionContextValue>({ reducedMotion: false })

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = React.useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <MotionContext.Provider value={{ reducedMotion }}>
      {children}
    </MotionContext.Provider>
  )
}

export function useMotion() {
  return React.useContext(MotionContext)
}

// ─── FadeSlide ────────────────────────────────────────────────────────────────

interface FadeSlideProps {
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
  duration?: number
}

export function FadeSlide({ children, delay = 0, direction = 'up', className, duration = 0.5 }: FadeSlideProps) {
  const { reducedMotion } = useMotion()
  const offset = 20
  const initial = {
    opacity: 0,
    y: direction === 'up' ? offset : direction === 'down' ? -offset : 0,
    x: direction === 'left' ? offset : direction === 'right' ? -offset : 0,
  }

  if (reducedMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── ScaleIn ──────────────────────────────────────────────────────────────────

export function ScaleIn({ children, delay = 0, className }: FadeSlideProps) {
  const { reducedMotion } = useMotion()
  if (reducedMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger container ────────────────────────────────────────────────────────

interface StaggerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerList({ children, staggerDelay = 0.07, className }: StaggerProps) {
  const { reducedMotion } = useMotion()

  if (reducedMotion) return <div className={className}>{children}</div>

  const items = React.Children.toArray(children)
  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * staggerDelay, ease: [0.16, 1, 0.3, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}

// ─── PageTransition ───────────────────────────────────────────────────────────

export function PageTransition({
  children,
  workspaceKey,
}: {
  children: React.ReactNode
  workspaceKey: string
}) {
  const { reducedMotion } = useMotion()

  if (reducedMotion) return <>{children}</>

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={workspaceKey}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.01 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Presence wrapper ─────────────────────────────────────────────────────────

export function Presence({
  show,
  children,
}: {
  show: boolean
  children: React.ReactNode
}) {
  const { reducedMotion } = useMotion()

  if (reducedMotion) return show ? <>{children}</> : null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── AnimatedCounter ──────────────────────────────────────────────────────────

export function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const { reducedMotion } = useMotion()
  const [display, setDisplay] = React.useState(0)
  const ref = React.useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  React.useEffect(() => {
    if (!isInView) return
    if (reducedMotion) {
      setDisplay(value)
      return
    }
    let start = 0
    const end = value
    const increment = end / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplay(end)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, value, duration, reducedMotion])

  return <span ref={ref}>{display.toLocaleString()}</span>
}

// ─── GlowText ───────────────────────────────────────────────────────────────────

export function GlowText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span
      className={className}
      animate={{
        textShadow: [
          '0 0 10px rgba(134,188,37,0.3)',
          '0 0 20px rgba(134,188,37,0.5)',
          '0 0 10px rgba(134,188,37,0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.span>
  )
}

// ─── MagneticButton ────────────────────────────────────────────────────────────

export function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const x = (clientX - left - width / 2) / 4
    const y = (clientY - top - height / 2) / 4
    setPosition({ x, y })
  }

  const reset = () => setPosition({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  )
}

// ─── ScrollReveal ──────────────────────────────────────────────────────────────

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })
  const { reducedMotion } = useMotion()

  if (reducedMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

// ─── ParticleField ─────────────────────────────────────────────────────────────

export function ParticleField({ count = 30 }: { count?: number }) {
  const { reducedMotion } = useMotion()
  if (reducedMotion) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-discovery/20"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, Math.random() * -100 - 50],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}