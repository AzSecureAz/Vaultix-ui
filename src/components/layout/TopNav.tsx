import { useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Bell, Menu, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@/components/ui/UserButton'
import { useCommandStore } from '@/stores/commandStore'

interface TopNavProps {
  onOpenMobileMenu?: () => void
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Account Profile',
  '/connected-accounts': 'Connected Accounts',
  '/mfa': 'Two-Step Verification',
  '/passkeys': 'Passkeys & WebAuthn',
  '/sessions': 'Active Sessions',
  '/admin/users': 'Users Directory',
  '/admin/roles': 'Roles Governance',
  '/admin/permissions': 'Permissions Directory',
  '/admin/signing-keys': 'Cryptographic Keys',
}

export function TopNav({ onOpenMobileMenu }: TopNavProps) {
  const { setOpen } = useCommandStore()
  const location = useLocation()

  const currentLabel = ROUTE_LABELS[location.pathname] || 'IAM Console'

  return (
    <header className="h-14 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/75 dark:bg-[#09090b]/80 backdrop-blur-xl px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors shadow-2xs">
      {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 font-medium text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>Vaultix</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate tracking-tight">
            {currentLabel}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Search Bar Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-zinc-100/70 dark:bg-white/[0.04] text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/[0.07] transition-all cursor-pointer shadow-2xs select-none"
      >
        <Search className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
        <span className="hidden sm:inline">Search commands or pages...</span>
        <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800/90 px-1 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls & Status */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Active &amp; Guarded</span>
        </div>

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

        {/* UserButton */}
        <UserButton />
      </div>
    </header>
  )
}
