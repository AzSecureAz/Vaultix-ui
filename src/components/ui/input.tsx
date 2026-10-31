import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-zinc-200/90 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50 px-3 py-1.5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-2xs transition-all duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/80 dark:focus-visible:border-blue-400/80 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/80 focus-visible:border-red-500 focus-visible:ring-red-500/20 text-red-900 dark:text-red-200',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 animate-in fade-in-50 duration-150">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
