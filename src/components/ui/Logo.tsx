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
    sm: 'h-7 w-7 rounded-lg',
    md: 'h-8 w-8 rounded-xl',
    lg: 'h-10 w-10 rounded-2xl',
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
          'relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 group',
          iconSizes[size]
        )}
      >
        <Shield className={cn('text-white stroke-[2.4] drop-shadow-xs transition-transform duration-200 group-hover:scale-110', glyphSizes[size])} />
        <div className="absolute inset-0 rounded-[inherit] bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={cn('font-bold tracking-tight text-zinc-900 dark:text-zinc-100', textSizes[size])}>
              Vaultix
            </span>
            {subtitle && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold px-1 rounded bg-blue-500/10 border border-blue-500/20">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
