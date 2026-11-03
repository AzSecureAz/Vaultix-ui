import { useState, useEffect, useRef, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  User,
  Link2,
  Shield,
  Fingerprint,
  Smartphone,
  X,
  Users,
  ShieldCheck,
  Lock,
  KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Logo } from '@/components/ui/Logo'

interface NavItemConfig {
  to: string
  label: string
  icon: React.ElementType
}

interface AnimatedNavGroupProps {
  items: NavItemConfig[]
  onItemClick?: () => void
}

/* Fluid sliding active tab indicator with high-contrast visible state */
function AnimatedNavGroup({ items, onItemClick }: AnimatedNavGroupProps) {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [indicator, setIndicator] = useState<{ top: number; height: number; opacity: number }>({
    top: 0,
    height: 0,
    opacity: 0,
  })

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  useEffect(() => {
    const updateIndicator = () => {
      if (!containerRef.current) return
      const activeElement = containerRef.current.querySelector<HTMLElement>('[data-active="true"]')
      if (activeElement) {
        setIndicator({
          top: activeElement.offsetTop,
          height: activeElement.offsetHeight,
          opacity: 1,
        })
      } else {
        setIndicator((prev) => ({ ...prev, opacity: 0 }))
      }
    }

    const raf = requestAnimationFrame(() => {
      updateIndicator()
      setIsMounted(true)
    })

    window.addEventListener('resize', updateIndicator)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [location.pathname, items])

  return (
    <nav ref={containerRef} className="relative space-y-1">
      {/* Sliding Active Highlight Pill */}
      <div
        className={cn(
          'absolute left-0 right-0 rounded-xl pointer-events-none select-none z-0',
          isMounted ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]' : 'transition-none'
        )}
        style={{
          transform: `translate3d(0, ${indicator.top}px, 0)`,
          height: `${indicator.height}px`,
          opacity: indicator.opacity,
        }}
      >
        {/* High-visibility active background card */}
        <div className="w-full h-full rounded-xl bg-zinc-200/80 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-white/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.4)]" />
        {/* Vibrant blue accent indicator bar on left edge */}
        <div className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
      </div>

      {items.map((item) => {
        const Icon = item.icon
        const active = isItemActive(item.to)

        return (
          <NavLink
            key={item.to}
            to={item.to}
            data-active={active}
            onClick={onItemClick}
            className={cn(
              'group relative z-10 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 select-none cursor-pointer',
              active
                ? 'text-zinc-950 dark:text-white font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-white/[0.04]'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-all duration-200',
                active
                  ? 'text-blue-600 dark:text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                  : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
              )}
            />
            <span className="truncate">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { user, hasPermission, hasRole } = useAuthStore()

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'VX'
  const primaryRole = user?.roles?.[0]?.replace('ROLE_', '') || 'USER'

  const hasUserAccess = hasPermission('user:*')
  const hasRoleAccess = hasPermission('role:*')
  const hasPermissionAccess = hasPermission('permission:*') || hasRole('ADMIN')
  const hasKeyAccess = hasPermission('key:*')
  const hasAdminAccess = hasUserAccess || hasRoleAccess || hasPermissionAccess || hasKeyAccess

  /* Primary Account Management Navigation Items */
  const accountNavItems: NavItemConfig[] = useMemo(
    () => [
      { to: '/dashboard', label: 'Profile Details', icon: User },
      { to: '/connected-accounts', label: 'Connected Accounts', icon: Link2 },
      { to: '/mfa', label: 'Two-Step Verification', icon: Shield },
      { to: '/passkeys', label: 'Passkeys (FIDO2)', icon: Fingerprint },
      { to: '/sessions', label: 'Active Sessions', icon: Smartphone },
    ],
    []
  )

  /* Administration Navigation Items */
  const adminNavItems: NavItemConfig[] = useMemo(() => {
    const list: NavItemConfig[] = []
    if (hasUserAccess) list.push({ to: '/admin/users', label: 'Users Directory', icon: Users })
    if (hasRoleAccess) list.push({ to: '/admin/roles', label: 'Roles Directory', icon: ShieldCheck })
    if (hasPermissionAccess) list.push({ to: '/admin/permissions', label: 'Permissions Directory', icon: Lock })
    if (hasKeyAccess) list.push({ to: '/admin/signing-keys', label: 'Signing Keys (JWKS)', icon: KeyRound })
    return list
  }, [hasUserAccess, hasRoleAccess, hasPermissionAccess, hasKeyAccess])

  const navContent = (
    <>
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
            Account Management
          </p>
          <AnimatedNavGroup items={accountNavItems} onItemClick={onClose} />
        </div>

        {/* Administration Section */}
        {hasAdminAccess && adminNavItems.length > 0 && (
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Administration
            </p>
            <AnimatedNavGroup items={adminNavItems} onItemClick={onClose} />
          </div>
        )}
      </div>

      {/* Sidebar Profile Widget */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
        >
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-bold tracking-wider shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c0c10]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {user?.full_name || user?.username || 'User'}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <Shield className="h-2.5 w-2.5 text-blue-500" />
              <span className="truncate uppercase font-mono tracking-tight">{primaryRole}</span>
            </div>
          </div>
        </NavLink>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c0c10] flex-col shrink-0 h-screen sticky top-0 select-none transition-colors">
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-200/80 dark:border-white/[0.08]">
          <Logo size="sm" subtitle="IAM" />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
            v2.4
          </span>
        </div>
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />

          <aside className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-white dark:bg-[#0c0c10] border-r border-zinc-200 dark:border-white/[0.08] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 select-none">
            <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-200/80 dark:border-white/[0.08]">
              <Logo size="sm" subtitle="IAM" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
