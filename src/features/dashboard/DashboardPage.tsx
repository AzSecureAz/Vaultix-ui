import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Fingerprint,
  Calendar,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
  Link2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { VerifyEmailModal } from './components/VerifyEmailModal'
import { VerifyPhoneModal } from './components/VerifyPhoneModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { ChangeUsernameModal } from './components/ChangeUsernameModal'
import { ChangeEmailModal } from './components/ChangeEmailModal'
import { ChangePhoneNumberModal } from './components/ChangePhoneNumberModal'
import { LogoutAllModal } from '@/components/ui/LogoutAllModal'
import { maskPhoneNumber } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [copiedId, setCopiedId] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [isVerifyPhoneOpen, setIsVerifyPhoneOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false)
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false)
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false)
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false)
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Manage your personal identity credentials and security preferences.
        </p>
      </div>

      {/* Clerk-Style Hero Profile Card (Responsive) */}
      <div className="p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 backdrop-blur-md shadow-sm dark:shadow-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 transition-colors">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative group shrink-0">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-800 dark:to-zinc-950 text-white flex items-center justify-center text-lg sm:text-xl font-bold tracking-wider shadow-inner border border-zinc-300 dark:border-zinc-700">
              {user.username ? user.username.slice(0, 2).toUpperCase() : 'VX'}
            </div>
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" title="Online" />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user.full_name || user.username}
              </h2>
              {user.email_verified && (
                <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                @{user.username} &bull; {user.email}
              </p>
              {!user.email_verified && (
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                >
                  <Mail className="h-3 w-3" />
                  <span>Verify</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60">
          {user.roles && user.roles.length > 0 && (
            <Badge variant="default" className="font-mono text-[11px] sm:text-xs px-2 py-0.5 uppercase tracking-wide">
              {user.roles[0].replace('ROLE_', '')}
            </Badge>
          )}
          <Badge
            variant={user.status === 'ACTIVE' ? 'success' : 'secondary'}
            className="text-[11px] sm:text-xs px-2 py-0.5 capitalize"
          >
            {user.status ? user.status.toLowerCase() : 'active'}
          </Badge>
        </div>
      </div>

      {/* Section 1: Profile Information */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-semibold">Profile Details</CardTitle>
          </div>
          <CardDescription>
            Personal identity information associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs sm:text-sm">
          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
              Full Name
            </span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium break-all">
              {user.full_name || 'Not provided'}
            </span>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
              Username
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-zinc-900 dark:text-zinc-100 font-mono">
                @{user.username}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChangeUsernameOpen(true)}
                className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
              >
                Change username
              </Button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Email Address
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-900 dark:text-zinc-100 break-all">{user.email}</span>
              {user.email_verified ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  Primary
                </span>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Unverified
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                  >
                    Verify email
                  </Button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChangeEmailOpen(true)}
                className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
              >
                Change email
              </Button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Phone Number
            </span>
            {user.phone_number ? (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5">
                  <span className="text-zinc-900 dark:text-zinc-100 font-mono text-xs sm:text-sm">
                    {showPhoneNumber ? user.phone_number : maskPhoneNumber(user.phone_number)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                    title={showPhoneNumber ? 'Hide phone number' : 'Show phone number'}
                    aria-label={showPhoneNumber ? 'Hide phone number' : 'Show phone number'}
                  >
                    {showPhoneNumber ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {user.phone_number_verified ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      Unverified
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVerifyPhoneOpen(true)}
                      className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                    >
                      Verify phone
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangePhoneOpen(true)}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                >
                  Change phone
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                  No phone number attached
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangePhoneOpen(true)}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                >
                  Add phone
                </Button>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
              User ID
            </span>
            <div className="flex items-center gap-2 min-w-0 max-w-full">
              <span className="font-mono text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 truncate max-w-[190px] sm:max-w-none">
                {user.id}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyId}
                className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 shrink-0"
                title="Copy User ID"
              >
                {copiedId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Created
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {formatDate(user.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Security & Authentication */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-semibold">Security &amp; Authentication</CardTitle>
          </div>
          <CardDescription>
            Multi-factor verification, credentials, and access posture
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs sm:text-sm">
          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
              Two-Factor Authentication
            </span>
            <div>
              {user.mfa_enabled ? (
                <Badge variant="success" className="gap-1.5 text-xs">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Enabled (Authenticator App)</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1.5 text-xs">
                  <ShieldAlert className="h-3 w-3 text-zinc-400" />
                  <span>Not Enabled</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Passkeys / WebAuthn
            </span>
            <div className="flex items-center gap-2.5">
              {user.passkey_enabled ? (
                <>
                  <Badge variant="success" className="text-xs">Active</Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/passkeys')}
                    className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                  >
                    Manage passkeys
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">None registered</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/passkeys')}
                    className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                  >
                    Add passkey
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Connected Accounts
            </span>
            <div className="flex items-center gap-2.5">
              {(user.has_social_accounts || (user as any).hasSocialAccounts) ? (
                <Badge variant="success" className="text-xs">Connected</Badge>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400 text-xs">None linked</span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/connected-accounts')}
                className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
              >
                Manage accounts
              </Button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Password
            </span>
            <div className="flex items-center gap-3">
              {(user.has_password === false || (user as any).hasPassword === false) ? (
                <>
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">Not set</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="h-6 text-[11px] px-2 py-0 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                  >
                    Set password
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-mono text-zinc-500 tracking-wider">••••••••••••</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="h-7 text-xs px-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                  >
                    Change password
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Last Sign In
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {formatDate(user.last_login_at)}
            </span>
          </div>

          <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              Active Sessions
            </span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                Revoke all active tokens &amp; devices
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLogoutAllOpen(true)}
                className="h-7 text-xs px-2.5 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/60 dark:hover:bg-red-950/20 border-red-200/60 dark:border-red-900/40"
              >
                Sign out everywhere
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Roles & Permissions */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <CardTitle className="text-sm font-semibold">Roles &amp; Permissions</CardTitle>
          </div>
          <CardDescription>
            System privileges and capabilities granted to this user
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
              Assigned Roles
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role: string) => (
                  <Badge key={role} variant="default" className="font-mono text-xs px-2.5 py-1">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-zinc-500">No roles assigned</span>
              )}
            </div>
          </div>

          {user.permissions && user.permissions.length > 0 && (
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                Effective Permissions ({user.permissions.length})
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {user.permissions.map((perm: string) => (
                  <span
                    key={perm}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {user.email && (
        <VerifyEmailModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          email={user.email}
        />
      )}

      {user.phone_number && (
        <VerifyPhoneModal
          isOpen={isVerifyPhoneOpen}
          onClose={() => setIsVerifyPhoneOpen(false)}
          phoneNumber={user.phone_number}
        />
      )}

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <ChangeUsernameModal
        isOpen={isChangeUsernameOpen}
        onClose={() => setIsChangeUsernameOpen(false)}
        currentUsername={user.username}
      />

      <ChangeEmailModal
        isOpen={isChangeEmailOpen}
        onClose={() => setIsChangeEmailOpen(false)}
        currentEmail={user.email}
      />

      <ChangePhoneNumberModal
        isOpen={isChangePhoneOpen}
        onClose={() => setIsChangePhoneOpen(false)}
        currentPhoneNumber={user.phone_number}
      />

      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
      />
    </div>
  )
}
