import { NavLink } from 'react-router-dom'
import { User, Link2, Shield, Fingerprint, X, Users, ShieldCheck, Lock, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Logo } from '@/components/ui/Logo'

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

  const navContent = (
    <>
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-5">
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
            Account Management
          </p>
          <nav className="space-y-0.5">
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                )
              }
            >
              <User className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>Profile Details</span>
            </NavLink>

            <NavLink
              to="/connected-accounts"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                )
              }
            >
              <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>Connected Accounts</span>
            </NavLink>

            <NavLink
              to="/mfa"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                )
              }
            >
              <Shield className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>Two-Step Verification</span>
            </NavLink>

            <NavLink
              to="/passkeys"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                )
              }
            >
              <Fingerprint className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <span>Passkeys</span>
            </NavLink>
          </nav>
        </div>

        {/* Administration Section (Visible when user has admin permissions) */}
        {hasAdminAccess && (
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
              Administration
            </p>
            <nav className="space-y-0.5">
              {hasUserAccess && (
                <NavLink
                  to="/admin/users"
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                    )
                  }
                >
                  <Users className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span>Users Directory</span>
                </NavLink>
              )}

              {hasRoleAccess && (
                <NavLink
                  to="/admin/roles"
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                    )
                  }
                >
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span>Roles Directory</span>
                </NavLink>
              )}

              {hasPermissionAccess && (
                <NavLink
                  to="/admin/permissions"
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                    )
                  }
                >
                  <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span>Permissions Directory</span>
                </NavLink>
              )}

              {hasKeyAccess && (
                <NavLink
                  to="/admin/signing-keys"
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white font-semibold shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                    )
                  }
                >
                  <KeyRound className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span>Signing Keys</span>
                </NavLink>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Clerk-Style Sidebar Profile Widget */}
      <div className="p-3 border-t border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2.5 p-1 rounded-lg">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-bold tracking-wider shrink-0">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">
              {user?.full_name || user?.username || 'User'}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <Shield className="h-2.5 w-2.5" />
              <span className="truncate uppercase font-mono">{primaryRole}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar (hidden on mobile, visible on md+) */}
      <aside className="hidden md:flex w-60 border-r border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex-col shrink-0 h-screen sticky top-0 select-none transition-colors">
        {/* Brand Header */}
        <div className="h-14 flex items-center px-5 border-b border-zinc-200/90 dark:border-zinc-800/80">
          <Logo size="sm" subtitle="IAM" />
        </div>
        {navContent}
      </aside>

      {/* Mobile Drawer (visible only on mobile when mobileOpen is true) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
          />

          {/* Drawer Sidebar */}
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 select-none">
            <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-200/90 dark:border-zinc-800/80">
              <Logo size="sm" subtitle="IAM" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
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
