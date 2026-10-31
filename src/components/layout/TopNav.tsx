import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Bell, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@/components/ui/UserButton'
import { useCommandStore } from '@/stores/commandStore'

interface TopNavProps {
  onOpenMobileMenu?: () => void
}

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const { setOpen } = useCommandStore()

  return (
    <header className="h-14 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#0c0c10]/80 backdrop-blur-md px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Mobile Toggle & Breadcrumb Context */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
          <span className="font-medium text-zinc-500 dark:text-zinc-400 hidden sm:inline">Vaultix</span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">/</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">
            IAM Console
          </span>
        </div>
      </div>

      {/* Center: Command Palette Search Bar Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-100/60 dark:bg-white/[0.04] text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/20 transition-all cursor-pointer shadow-2xs select-none"
      >
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <span className="hidden sm:inline">Search or command...</span>
        <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800/80 px-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 h-8 w-8 rounded-lg"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

        {/* Clerk-Style UserButton */}
        <UserButton />
      </div>
    </header>
  )
}
