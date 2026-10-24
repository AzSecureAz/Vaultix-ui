import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default:
          'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300',
        secondary:
          'border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400',
        primary:
          'border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
        success:
          'border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning:
          'border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
        destructive:
          'border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
        outline:
          'border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
