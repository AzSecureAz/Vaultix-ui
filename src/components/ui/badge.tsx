import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border select-none',
  {
    variants: {
      variant: {
        default:
          'border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-2xs',
        secondary:
          'border-zinc-200/80 dark:border-white/[0.06] bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400',
        primary:
          'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-2xs',
        success:
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-2xs',
        warning:
          'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-2xs',
        destructive:
          'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300 shadow-2xs',
        outline:
          'border-zinc-300 dark:border-white/10 bg-transparent text-zinc-700 dark:text-zinc-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  pulse?: boolean
}

function getDotColor(variant?: BadgeProps['variant']) {
  switch (variant) {
    case 'success':
      return 'bg-emerald-500'
    case 'warning':
      return 'bg-amber-500'
    case 'destructive':
      return 'bg-red-500'
    case 'primary':
      return 'bg-blue-500'
    default:
      return 'bg-zinc-500 dark:bg-zinc-400'
  }
}

function Badge({ className, variant, dot = false, pulse = false, children, ...props }: BadgeProps) {
  const dotColor = getDotColor(variant)

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColor)} />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotColor)} />
        </span>
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
