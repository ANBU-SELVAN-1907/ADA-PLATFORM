import React, { memo } from 'react'
import { motion } from 'framer-motion'

export const LuxuryBackground = memo(function LuxuryBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-surface-base z-0 pointer-events-none select-none transform-gpu contain-strict">
      {/* Dark Grey Base Gradient (Visible only in Dark Mode) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030407] via-[#0A0D14] to-[#010204] opacity-95 hidden dark:block" />

      {/* Luxury Micro-Grid (Faint Grey/White) */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Deloitte Green Light Leak / Ambient Glow */}
      <motion.div
        className="absolute top-[-25%] left-[-15%] w-[65vw] h-[65vw] rounded-full blur-[90px] transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, var(--orb-color-1) 0%, transparent 70%)',
          opacity: 'var(--orb-opacity-1)',
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, 15, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Luxury Deep Charcoal/Grey Glow Orb */}
      <motion.div
        className="absolute bottom-[-15%] right-[-5%] w-[55vw] h-[55vw] rounded-full blur-[80px] transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, var(--orb-color-2) 0%, transparent 75%)',
          opacity: 'var(--orb-opacity-2)',
        }}
        animate={{
          x: [0, -25, 0],
          y: [0, -35, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Deloitte Green secondary glow to add depth */}
      <motion.div
        className="absolute top-[40%] right-[20%] w-[45vw] h-[45vw] rounded-full blur-[100px] transform-gpu will-change-transform"
        style={{
          background: 'radial-gradient(circle, var(--orb-color-1) 0%, transparent 70%)',
          opacity: 'calc(var(--orb-opacity-1) * 0.7)',
        }}
        animate={{
          scale: [0.95, 1.1, 0.95],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Faint White highlight leak in the center */}
      <div 
        className="absolute top-[20%] left-[30%] w-[35vw] h-[35vw] rounded-full blur-[110px] opacity-[0.03] transform-gpu"
        style={{
          background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)',
        }}
      />

      {/* Floating Deloitte Green & Grey Micro-particles */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none">
        <pattern id="lux-dust-pattern" width="120" height="120" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="25" r="0.7" fill="#FFFFFF" />
          <circle cx="65" cy="75" r="1.1" fill="#86BC25" />
          <circle cx="95" cy="35" r="0.8" fill="#52525B" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#lux-dust-pattern)" />
      </svg>
    </div>
  )
})
