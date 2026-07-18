import React, { useState, useEffect } from 'react'
import { motion, useScroll } from 'framer-motion'
import { Cpu, Settings, Activity, FileText, LayoutDashboard } from 'lucide-react'
import { useStore } from '../../store'

export function TopNav() {
  const { 
    toggleSettings, 
    currentPage, 
    isRunning, 
    analysisProgress, 
    reset, 
    setPage,
    payload 
  } = useStore()

  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    return scrollY.onChange((latest) => {
      const previous = scrollY.getPrevious() ?? 0
      if (latest > previous && latest > 150) {
        setHidden(true)
      } else {
        setHidden(false)
      }
    })
  }, [scrollY])

  const navItems = [
    { id: 'landing', label: 'Cockpit', icon: <LayoutDashboard size={12} />, enabled: true },
    { id: 'processing', label: 'Pipeline', icon: <Activity size={12} />, enabled: isRunning || payload !== null },
    { id: 'results', label: 'Insights', icon: <FileText size={12} />, enabled: payload !== null }
  ]

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-full px-4 select-none pointer-events-none">
      <motion.div 
        className="flex items-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-[#06080C]/90 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.85)] pointer-events-auto"
        variants={{
          visible: { y: 0, opacity: 1, scale: 1 },
          hidden: { y: -80, opacity: 0, scale: 0.95 }
        }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        initial="visible"
      >
        {/* Left White Circular Logo Button */}
        <motion.button 
          onClick={reset}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#06080C] shrink-0 shadow-[0_2px_8px_rgba(255,255,255,0.15)] cursor-pointer border-none outline-none"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title="Reset to Cockpit"
        >
          <Cpu size={15} strokeWidth={2.5} className="animate-pulse" />
        </motion.button>

        {/* Divider */}
        <div className="w-px h-4 bg-white/10 mx-0.5" aria-hidden />

        {/* Navigation Items */}
        <div className="flex items-center">
          {navItems.map((item) => {
            const isActive = currentPage === item.id
            const isClickable = item.enabled

            return (
              <button
                key={item.id}
                disabled={!isClickable}
                onClick={() => setPage(item.id as any)}
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-150 border-none outline-none ${
                  isActive 
                    ? 'text-[#06080C] z-10 font-extrabold' 
                    : isClickable 
                      ? 'text-text-secondary hover:text-text-primary cursor-pointer' 
                      : 'text-text-muted/30 cursor-not-allowed'
                }`}
              >
                {/* Active capsule background */}
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_2px_6px_rgba(255,255,255,0.15)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="hidden sm:inline">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>



        {/* Settings / Active CTA Button (White Pill style) */}
        <motion.button
          onClick={toggleSettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#06080C] hover:bg-white/95 font-bold text-[10px] tracking-wider uppercase shrink-0 cursor-pointer shadow-[0_2px_8px_rgba(255,255,255,0.15)] border-none outline-none"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRunning ? (
            <>
              <Activity size={12} className="animate-pulse text-discovery" />
              <span>{analysisProgress}%</span>
            </>
          ) : (
            <>
              <Settings size={11} strokeWidth={2.5} />
              <span>Config</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}