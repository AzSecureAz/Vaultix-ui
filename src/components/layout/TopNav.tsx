import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@/components/ui/UserButton'

interface TopNavProps {
  onOpenMobileMenu?: () => void
}

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  return (
    <header className="h-14 border-b border-zinc-200/90 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Mobile Toggle & Breadcrumb Context */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
          <span className="font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline">Vaultix</span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">/</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">
            Account
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 h-8 w-8"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Clerk-Style UserButton */}
        <UserButton />
      </div>
    </header>
  )
}
