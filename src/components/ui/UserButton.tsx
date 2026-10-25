import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon, Shield, CheckCircle2, ShieldAlert, Link2, Fingerprint, Smartphone } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import { LogoutAllModal } from '@/components/ui/LogoutAllModal'
import { LogoutOtherModal } from '@/components/ui/LogoutOtherModal'

export function UserButton() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isLogoutOtherOpen, setIsLogoutOtherOpen] = useState(false)
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate('/login')
  }

  if (!user) return null

  const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'VX'
  const primaryRole = user.roles?.[0]?.replace('ROLE_', '') || 'USER'

  return (
    <div className="relative" ref={menuRef}>
      {/* Clerk Signature Avatar Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-zinc-700 dark:to-zinc-900 text-white flex items-center justify-center text-xs font-semibold tracking-wider shadow-xs hover:ring-2 hover:ring-zinc-900/10 dark:hover:ring-white/20 transition-all cursor-pointer select-none border border-zinc-200/80 dark:border-zinc-700"
        title="Account"
      >
        {initials}
      </button>

      {/* Clerk Signature UserButton Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-64 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/95 backdrop-blur-xl shadow-xl shadow-zinc-950/10 dark:shadow-2xl dark:shadow-black/70 z-50 p-2 space-y-1.5 transition-all animate-in fade-in zoom-in-95">
          {/* User Header Profile */}
          <div className="p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/60 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.full_name || user.username}
                </p>
                {user.email_verified && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                {user.email}
              </p>
              <div className="mt-1">
                <Badge variant="default" className="text-[9px] py-0 px-1 font-mono uppercase">
                  {primaryRole}
                </Badge>
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800/70 my-1" />

          {/* Navigation Action Items */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                navigate('/dashboard')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
            >
              <UserIcon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Manage account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/connected-accounts')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
            >
              <Link2 className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Connected accounts</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/mfa')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
            >
              <Shield className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Two-step verification</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigate('/passkeys')
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer text-left"
            >
              <Fingerprint className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Passkeys</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-500/10 transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Sign out</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsLogoutOtherOpen(true)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-blue-500/10 transition-colors cursor-pointer text-left"
            >
              <Smartphone className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Sign out from other devices</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsLogoutAllOpen(true)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-500/10 transition-colors cursor-pointer text-left"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Sign out from everywhere</span>
            </button>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800/70 my-1" />

          {/* Clerk-Style Secured Footer */}
          <div className="pt-1 pb-0.5 flex items-center justify-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            <Shield className="h-2.5 w-2.5" />
            <span>Secured by Vaultix IAM</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Sign out other devices */}
      <LogoutOtherModal
        isOpen={isLogoutOtherOpen}
        onClose={() => setIsLogoutOtherOpen(false)}
      />

      {/* Confirmation Modal for Sign out everywhere */}
      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
      />
    </div>
  )
}
