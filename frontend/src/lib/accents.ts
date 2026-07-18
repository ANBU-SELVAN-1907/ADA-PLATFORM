/* ─────────────────────────────────────────────
   Static accent class maps — fixes Tailwind purge bug
   Dynamic classes like `bg-${accent}/15` are purged by JIT.
   This map ensures all classes are statically present so Tailwind emits them.
   ───────────────────────────────────────────── */

export type AccentName =
    | 'discovery'
    | 'knowledge'
    | 'infra'
    | 'security'
    | 'telemetry'
    | 'reports'

interface AccentClasses {
    /** Solid text color */
    text: string
    /** Solid background */
    bg: string
    /** Muted background (12% alpha) */
    bgMuted: string
    /** Border (25% alpha) */
    border: string
    /** Border at 40% alpha */
    borderStrong: string
    /** Background at 10% alpha */
    bg10: string
    /** Background at 15% alpha */
    bg15: string
    /** Background at 20% alpha */
    bg20: string
    /** Background at 5% alpha */
    bg5: string
    /** Glow shadow */
    glow: string
    /** Gradient from accent/20 to accent/5 */
    gradient: string
    /** Ring color for focus states */
    ring: string
}

export const ACCENTS: Record<AccentName, AccentClasses> = {
    discovery: {
        text: 'text-discovery',
        bg: 'bg-discovery',
        bgMuted: 'bg-discovery/12',
        border: 'border-discovery/25',
        borderStrong: 'border-discovery/40',
        bg10: 'bg-discovery/10',
        bg15: 'bg-discovery/15',
        bg20: 'bg-discovery/20',
        bg5: 'bg-discovery/5',
        glow: 'shadow-glow-green',
        gradient: 'from-discovery/20 to-discovery/5',
        ring: 'ring-discovery/40',
    },
    knowledge: {
        text: 'text-knowledge',
        bg: 'bg-knowledge',
        bgMuted: 'bg-knowledge/12',
        border: 'border-knowledge/25',
        borderStrong: 'border-knowledge/40',
        bg10: 'bg-knowledge/10',
        bg15: 'bg-knowledge/15',
        bg20: 'bg-knowledge/20',
        bg5: 'bg-knowledge/5',
        glow: 'shadow-glow-blue',
        gradient: 'from-knowledge/20 to-knowledge/5',
        ring: 'ring-knowledge/40',
    },
    infra: {
        text: 'text-infra',
        bg: 'bg-infra',
        bgMuted: 'bg-infra/12',
        border: 'border-infra/25',
        borderStrong: 'border-infra/40',
        bg10: 'bg-infra/10',
        bg15: 'bg-infra/15',
        bg20: 'bg-infra/20',
        bg5: 'bg-infra/5',
        glow: 'shadow-glow-purple',
        gradient: 'from-infra/20 to-infra/5',
        ring: 'ring-infra/40',
    },
    security: {
        text: 'text-security',
        bg: 'bg-security',
        bgMuted: 'bg-security/12',
        border: 'border-security/25',
        borderStrong: 'border-security/40',
        bg10: 'bg-security/10',
        bg15: 'bg-security/15',
        bg20: 'bg-security/20',
        bg5: 'bg-security/5',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
        gradient: 'from-security/20 to-security/5',
        ring: 'ring-security/40',
    },
    telemetry: {
        text: 'text-telemetry',
        bg: 'bg-telemetry',
        bgMuted: 'bg-telemetry/12',
        border: 'border-telemetry/25',
        borderStrong: 'border-telemetry/40',
        bg10: 'bg-telemetry/10',
        bg15: 'bg-telemetry/15',
        bg20: 'bg-telemetry/20',
        bg5: 'bg-telemetry/5',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
        gradient: 'from-telemetry/20 to-telemetry/5',
        ring: 'ring-telemetry/40',
    },
    reports: {
        text: 'text-reports',
        bg: 'bg-reports',
        bgMuted: 'bg-reports/12',
        border: 'border-reports/25',
        borderStrong: 'border-reports/40',
        bg10: 'bg-reports/10',
        bg15: 'bg-reports/15',
        bg20: 'bg-reports/20',
        bg5: 'bg-reports/5',
        glow: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]',
        gradient: 'from-reports/20 to-reports/5',
        ring: 'ring-reports/40',
    },
}

/** Severity classes — consolidated to security tokens (audit fix #5) */
export type Severity = 'critical' | 'high' | 'medium' | 'low'

interface SeverityClasses {
    text: string
    bg: string
    border: string
    dot: string
    label: string
}

export const SEVERITY: Record<Severity, SeverityClasses> = {
    critical: {
        text: 'text-security',
        bg: 'bg-security/10',
        border: 'border-security/25',
        dot: 'bg-security',
        label: 'Critical',
    },
    high: {
        text: 'text-security',
        bg: 'bg-security/10',
        border: 'border-security/25',
        dot: 'bg-security',
        label: 'High',
    },
    medium: {
        text: 'text-security-medium',
        bg: 'bg-security-medium/10',
        border: 'border-security-medium/25',
        dot: 'bg-security-medium',
        label: 'Medium',
    },
    low: {
        text: 'text-security-low',
        bg: 'bg-security-low/10',
        border: 'border-security-low/25',
        dot: 'bg-security-low',
        label: 'Low',
    },
}

/** Hex values for inline styles (SVG, gradients) */
export const ACCENT_HEX: Record<AccentName, string> = {
    discovery: '#86BC25',
    knowledge: '#00A3E0',
    infra: '#8B5CF6',
    security: '#EF4444',
    telemetry: '#F59E0B',
    reports: '#EC4899',
}