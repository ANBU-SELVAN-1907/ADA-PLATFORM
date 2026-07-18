import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  /** Icon shown before the text in default state */
  icon?: React.ReactNode
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost'
}

/**
 * Button with a sliding fill + text-swap animation on hover.
 * Adapts the project's design tokens: discovery green for primary, surface for secondary.
 */
const InteractiveHoverButton = React.forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(
  ({ text = 'Button', icon, variant = 'primary', className, disabled, ...props }, ref) => {
    const variantStyles = {
      primary: {
        base: 'border-discovery/40 bg-surface-card text-text-primary',
        fill: 'bg-discovery',
        label: 'text-text-inverse',
      },
      secondary: {
        base: 'border-surface-border bg-surface-elevated text-text-secondary',
        fill: 'bg-surface-floating',
        label: 'text-text-primary',
      },
      ghost: {
        base: 'border-white/10 bg-transparent text-text-muted',
        fill: 'bg-white/10',
        label: 'text-text-primary',
      },
    }[variant]

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Layout
          'group relative inline-flex cursor-pointer overflow-hidden rounded-xl border',
          'px-5 py-2.5 text-sm font-semibold select-none',
          // Transitions
          'transition-colors duration-150 ease-out',
          // States
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
          // Variant base
          variantStyles.base,
          className,
        )}
        {...props}
      >
        {/* Default label — slides out on hover */}
        <span className="relative z-10 inline-flex items-center gap-2 transition-all duration-150 ease-out group-hover:translate-x-10 group-hover:opacity-0">
          {icon && <span className="shrink-0">{icon}</span>}
          {text}
        </span>

        {/* Hover label — slides in from left */}
        <span
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center gap-2',
            '-translate-x-10 opacity-0',
            'transition-all duration-150 ease-out',
            'group-hover:translate-x-0 group-hover:opacity-100',
            variantStyles.label,
          )}
        >
          {text}
          <ArrowRight size={15} className="shrink-0" />
        </span>

        {/* Animated fill blob */}
        <span
          className={cn(
            'absolute left-[18%] top-[38%]',
            'h-2 w-2 rounded-lg',
            'transition-all duration-200 ease-out',
            'group-hover:left-[-4%] group-hover:top-[-4%]',
            'group-hover:h-[115%] group-hover:w-[115%]',
            'group-hover:rounded-xl',
            variantStyles.fill,
          )}
          aria-hidden
        />
      </button>
    )
  }
)

InteractiveHoverButton.displayName = 'InteractiveHoverButton'

export { InteractiveHoverButton }
export type { InteractiveHoverButtonProps }
