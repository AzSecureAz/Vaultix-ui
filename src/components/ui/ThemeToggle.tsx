import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  variant?: 'dropdown' | 'segmented'
}

export function ThemeToggle({ className, variant = 'dropdown' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const options: Array<{ label: string; value: Theme; icon: typeof Sun }> = [
    { label: 'Light', value: 'light', icon: Sun },
    { label: 'Dark', value: 'dark', icon: Moon },
    { label: 'System', value: 'system', icon: Laptop },
  ]

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs select-none',
          className
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon
          const isActive = theme === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md font-medium transition-all duration-150',
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
              title={`${opt.label} mode`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">{opt.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('relative inline-block text-left', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
        title="Toggle theme (Light, Dark, System)"
        aria-label="Toggle theme"
      >
        {theme === 'system' ? (
          <Laptop className="h-4 w-4" />
        ) : theme === 'dark' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-lg shadow-black/10 dark:shadow-black/50 z-50 text-xs">
          {options.map((opt) => {
            const Icon = opt.icon
            const isSelected = theme === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md font-medium transition-colors text-left cursor-pointer',
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{opt.label}</span>
                  {opt.value === 'system' && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                      ({resolvedTheme})
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
