import React, { useState } from 'react'
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Smartphone,
  Fingerprint,
  KeyRound,
  Calendar,
  Clock,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  Power,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { maskPhoneNumber } from '@/lib/utils'
import type { UserItem } from '../api/usersApi'

interface UserInspectionDrawerProps {
  user: UserItem | null
  isOpen: boolean
  onClose: () => void
  onEdit: (user: UserItem) => void
  onToggleStatus: (user: UserItem) => void
  onDeleteOrRestore: (user: UserItem) => void
  onResetMfa: (user: UserItem) => void
  canUpdate: boolean
  canDelete: boolean
  canRestore: boolean
}

export const UserInspectionDrawer: React.FC<UserInspectionDrawerProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDeleteOrRestore,
  onResetMfa,
  canUpdate,
  canDelete,
  canRestore,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showPhone, setShowPhone] = useState(false)

  if (!isOpen || !user) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Never'
    try {
      return new Date(isoString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return isoString
    }
  }

  const isLocked = Boolean(
    user.locked_until && new Date(user.locked_until).getTime() > Date.now()
  )

  const hasMfa = Boolean(
    user.mfa_enabled || user.mfaEnabled || user.sms_mfa_enabled || user.smsMfaEnabled
  )

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#111116] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  User Audit Profile
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  ID: {user.id.slice(0, 8)}...
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Identity Card */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-zinc-950 dark:text-white">
                    {user.full_name || user.fullName || `@${user.username}`}
                  </h4>
                  <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    @{user.username}
                  </p>
                </div>

                <Badge
                  variant={
                    user.status === 'ACTIVE'
                      ? 'success'
                      : user.status === 'DISABLED'
                      ? 'warning'
                      : 'destructive'
                  }
                  dot
                  className="font-bold text-xs"
                >
                  {user.status}
                </Badge>
              </div>

              {/* Copyable Identifiers */}
              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center justify-between py-1 border-t border-zinc-200/60 dark:border-zinc-800">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Email:</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-zinc-900 dark:text-zinc-100">
                    <span>{user.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(user.email, 'email')}
                      className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {(user.phone_number || user.phoneNumber) && (
                  <div className="flex items-center justify-between py-1 border-t border-zinc-200/60 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Phone:</span>
                    </span>
                    <div className="flex items-center gap-1 font-mono text-zinc-900 dark:text-zinc-100">
                      <span>
                        {showPhone
                          ? user.phone_number || user.phoneNumber
                          : maskPhoneNumber(user.phone_number || user.phoneNumber)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPhone(!showPhone)}
                        className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title={showPhone ? 'Hide' : 'Reveal'}
                      >
                        {showPhone ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lockout & Brute-Force Monitoring Banner */}
            {isLocked ? (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span>Account Under Security Lockout</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  Locked until {formatDate(user.locked_until)} due to excessive failed login attempts ({user.failed_login_attempts ?? user.failedLoginAttempts ?? 5}).
                </p>
              </div>
            ) : (user.failed_login_attempts ?? user.failedLoginAttempts ?? 0) > 0 ? (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Failed Login Attempts:</span>
                </span>
                <span className="font-mono font-bold">
                  {user.failed_login_attempts ?? user.failedLoginAttempts} / 5
                </span>
              </div>
            ) : null}

            {/* Assigned Roles & Hierarchy Level */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Assigned RBAC Roles ({user.roles?.length || 0})
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <Badge
                      key={r}
                      variant="outline"
                      className="text-xs font-mono font-semibold py-1 px-2.5 border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/5"
                    >
                      {r}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400 italic">No roles assigned</span>
                )}
              </div>
            </div>

            {/* Multi-Factor & Posture Status */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Security Controls
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">Email Status</p>
                    <p className="text-[11px] text-zinc-500">
                      {user.email_verified || user.emailVerified ? 'Verified' : 'Unverified'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">2FA Status</p>
                    <p className="text-[11px] text-zinc-500">
                      {hasMfa ? 'Active' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">FIDO2 Passkey</p>
                    <p className="text-[11px] text-zinc-500">
                      {user.passkey_enabled || user.passkeyEnabled ? 'Enrolled' : 'None'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/[0.01] flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">Password</p>
                    <p className="text-[11px] text-zinc-500">
                      {user.has_password || user.hasPassword ? 'Configured' : 'None (SSO)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Trail & Timestamps */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Audit Trail
              </h5>
              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Created:</span>
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatDate(user.created_at || user.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Last Sign-In:</span>
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatDate(user.last_login_at || user.lastLoginAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] flex flex-wrap gap-2">
            {canUpdate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit(user)
                }}
                className="flex-1 h-9 text-xs font-bold border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                <span>Edit Roles</span>
              </Button>
            )}

            {canUpdate && hasMfa && user.status !== 'DELETED' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onResetMfa(user)
                }}
                className="h-9 px-3 text-xs font-bold border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer"
                title="Reset Two-Factor Authentication"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                <span>Reset 2FA</span>
              </Button>
            )}

            {canUpdate && user.status !== 'DELETED' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onToggleStatus(user)
                }}
                className={`h-9 px-3 text-xs font-bold cursor-pointer ${
                  user.status === 'ACTIVE'
                    ? 'border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                }`}
              >
                <Power className="h-3.5 w-3.5 mr-1" />
                <span>{user.status === 'ACTIVE' ? 'Disable' : 'Enable'}</span>
              </Button>
            )}

            {(canDelete || canRestore) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onDeleteOrRestore(user)
                }}
                className={`h-9 px-3 text-xs font-bold cursor-pointer ${
                  user.status === 'DELETED'
                    ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'border-red-500/30 text-red-700 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20'
                }`}
              >
                {user.status === 'DELETED' ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>Delete</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
