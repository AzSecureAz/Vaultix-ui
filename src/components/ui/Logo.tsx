import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  subtitle?: string
}

export function Logo({ size = 'md', showText = true, className, subtitle }: LogoProps) {
  const iconSizes = {
    sm: 'h-6 w-6 rounded-md',
    md: 'h-8 w-8 rounded-lg',
    lg: 'h-10 w-10 rounded-xl',
  }

  const glyphSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <div
        className={cn(
          'bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm shrink-0',
          iconSizes[size]
        )}
      >
        <Shield className={cn('text-zinc-200 stroke-[2.2]', glyphSizes[size])} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={cn('font-semibold tracking-tight text-zinc-900 dark:text-zinc-100', textSizes[size])}>
              Vaultix
            </span>
            {subtitle && (
              <span className="text-[11px] text-zinc-500 font-normal">
                / {subtitle}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
