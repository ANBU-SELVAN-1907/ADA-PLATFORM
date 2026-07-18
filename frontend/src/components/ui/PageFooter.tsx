import React from 'react'
import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, User, ExternalLink, Cpu, ShieldCheck } from 'lucide-react'

export function PageFooter() {
  const links = [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/anbu-selvan-t-b07b63368/',
      icon: <Linkedin size={14} />,
      color: '#0A66C2',
      glow: 'rgba(10,102,194,0.3)',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/ANBU-SELVAN-1907',
      icon: <Github size={14} />,
      color: '#E6EDF3',
      glow: 'rgba(230,237,243,0.2)',
    },
    {
      label: 'Email',
      href: 'mailto:anbu.t80555@gmail.com',
      icon: <Mail size={14} />,
      color: '#86BC25',
      glow: 'rgba(134,188,37,0.3)',
    },
  ]

  return (
    <motion.footer
      className="w-full mt-12 pb-8 shrink-0 relative z-10 select-none"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Decorative Separator Line */}
      <div className="relative flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-border/60 to-transparent" />
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-surface-border/40 bg-surface-elevated/40 backdrop-blur-md shadow-sm">
          <Cpu size={10} className="text-discovery" />
          <span className="text-[8px] font-bold tracking-[0.25em] uppercase text-text-muted">
            ADA — Application Discovery Agent Platform
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-border/60 to-transparent" />
      </div>

      {/* Main Footer Card Grid */}
      <div className="max-w-5xl mx-auto rounded-3xl border border-surface-border/50 bg-[#0B1120]/40 backdrop-blur-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center shadow-2xl relative overflow-hidden">
        {/* Subtle Decorative Ambient Glow on Footer Card */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(134,188,37,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Column 1: Creator Badge */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(134,188,37,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(134,188,37,0.2)'
              }}
            >
              <User size={16} className="text-discovery" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Designed by</h4>
              <p className="text-sm font-extrabold text-text-primary tracking-tight mt-0.5">Anbu Selvan T</p>
              <p className="text-[10px] text-text-muted">Full-Stack Engineer · AI Architect</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-discovery/5 px-2.5 py-1 rounded-full border border-discovery/10">
            <div className="w-1.5 h-1.5 rounded-full bg-discovery animate-pulse" />
            <span className="text-[9px] text-text-secondary font-mono tracking-wider font-semibold">
              Project for <span className="text-discovery font-extrabold">Deloitte</span>
            </span>
          </div>
        </div>

        {/* Column 2: Social Connect Links */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em]">Connect & Collaborate</span>
          <div className="flex items-center gap-2">
            {links.map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('mailto') ? '_self' : '_blank'}
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-border bg-surface-elevated/40 hover:bg-surface-elevated transition-all duration-200 cursor-pointer group shadow-sm"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={(e) => {
                  const el = e.target as HTMLElement
                  if (el?.style) {
                    el.style.borderColor = link.color + '44'
                    el.style.boxShadow = `0 0 16px ${link.glow}`
                  }
                }}
                onHoverEnd={(e) => {
                  const el = e.target as HTMLElement
                  if (el?.style) {
                    el.style.borderColor = 'var(--surface-border)'
                    el.style.boxShadow = 'none'
                  }
                }}
              >
                <span style={{ color: link.color }}>{link.icon}</span>
                <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                  {link.label}
                </span>
                <ExternalLink size={8} className="text-text-subtle group-hover:text-text-muted transition-colors" />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Column 3: Platform Telemetry & Details */}
        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 bg-[#03060E]/50">
            <ShieldCheck size={11} className="text-discovery" />
            <span className="text-[8px] font-mono text-text-muted">ADA MODULE v3.0.0</span>
          </div>
          <p className="text-[10px] text-text-secondary font-bold">
            ADA · Application Discovery Agent
          </p>
          <span className="text-[8px] text-text-subtle font-mono mt-1">
            © 2026 ADA. All rights reserved.
          </span>
        </div>
      </div>
    </motion.footer>
  )
}
