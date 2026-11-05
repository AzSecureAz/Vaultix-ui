import { useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Menu, Search, ShieldCheck } from 'lucide-react'
import { UserButton } from '@/components/ui/UserButton'
import { useCommandStore } from '@/stores/commandStore'
import { SudoStatusPill } from '@/components/layout/SudoStatusPill'
import { NotificationCenter } from '@/components/layout/NotificationCenter'

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
    <header className="h-16 border-b border-zinc-200 dark:border-white/[0.08] bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors shadow-2xs">
      {/* Left: Mobile Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 text-sm min-w-0">
          <div className="hidden sm:flex items-center gap-2 font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>Vaultix</span>
            <span className="text-zinc-300 dark:text-zinc-700 font-normal">/</span>
          </div>
          <span className="text-zinc-950 dark:text-white font-bold tracking-tight text-base truncate">
            {currentLabel}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Search Bar Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-100/80 dark:bg-white/[0.04] text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-2xs select-none"
      >
        <Search className="h-4 w-4 text-zinc-500 group-hover:text-blue-500 transition-colors" />
        <span className="hidden sm:inline font-medium">Search commands or pages...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-300 dark:border-white/15 bg-white dark:bg-zinc-800/90 px-1.5 font-mono text-xs text-zinc-600 dark:text-zinc-300 shadow-2xs font-semibold">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls & Status */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Dynamic Sudo Mode Status Pill */}
        <SudoStatusPill />

        {/* Live Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Active &amp; Guarded</span>
        </div>

        <ThemeToggle />

        {/* Security & Activity Notification Center */}
        <NotificationCenter />

        <div className="h-5 w-px bg-zinc-200 dark:bg-white/[0.08]" />

        {/* UserButton */}
        <UserButton />
      </div>
    </header>
  )
}
