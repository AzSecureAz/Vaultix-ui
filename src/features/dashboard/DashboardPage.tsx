import { useState, useMemo } from 'react'
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
  AlertTriangle,
  Trash2,
  ExternalLink,
  Sparkles,
  Smartphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { VerifyEmailModal } from './components/VerifyEmailModal'
import { VerifyPhoneModal } from './components/VerifyPhoneModal'
import { ChangePasswordModal } from './components/ChangePasswordModal'
import { ChangeUsernameModal } from './components/ChangeUsernameModal'
import { ChangeFullNameModal } from './components/ChangeFullNameModal'
import { ChangeEmailModal } from './components/ChangeEmailModal'
import { ChangePhoneNumberModal } from './components/ChangePhoneNumberModal'
import { DeleteAccountModal } from './components/DeleteAccountModal'
import { LogoutAllModal } from '@/components/ui/LogoutAllModal'
import { maskPhoneNumber } from '@/lib/utils'

type DashboardTab = 'profile' | 'security' | 'permissions' | 'danger'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuthStore()
  const [activeTab, setActiveTab] = useState<DashboardTab>('profile')
  const [copiedId, setCopiedId] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [isVerifyPhoneOpen, setIsVerifyPhoneOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false)
  const [isChangeFullNameOpen, setIsChangeFullNameOpen] = useState(false)
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false)
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false)
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  /* Compute Real-Time Security Health Posture Score (0-100) */
  const securityHealth = useMemo(() => {
    if (!user) return { score: 20, level: 'Basic', color: 'text-amber-500', bg: 'bg-amber-500' }
    let score = 20 // baseline registered user
    if (user.email_verified) score += 25
    if (user.mfa_enabled || user.sms_mfa_enabled) score += 25
    if (user.passkey_enabled) score += 20
    if (user.phone_number_verified) score += 10

    if (score >= 90) return { score, level: 'Maximum Protection', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500' }
    if (score >= 65) return { score, level: 'Strong Posture', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500' }
    return { score, level: 'Hardening Recommended', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500' }
  }, [user])

  /* Group effective permissions by domain prefix (e.g. user, role, key, permission) */
  const groupedPermissions = useMemo(() => {
    if (!user?.permissions || user.permissions.length === 0) return []

    const domainMeta: Record<string, { label: string; icon: React.ElementType; color: string; badgeBg: string }> = {
      user: {
        label: 'Users Management',
        icon: User,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      },
      role: {
        label: 'Role Governance',
        icon: ShieldCheck,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
      },
      key: {
        label: 'Cryptographic Keys',
        icon: KeyRound,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      },
      permission: {
        label: 'Permissions Directory',
        icon: Shield,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      },
    }

    const groups: Record<string, { domain: string; label: string; icon: React.ElementType; color: string; badgeBg: string; actions: string[] }> = {}

    user.permissions.forEach((perm) => {
      const [domain, action] = perm.includes(':') ? perm.split(':', 2) : ['general', perm]
      if (!groups[domain]) {
        const meta = domainMeta[domain] || {
          label: domain.charAt(0).toUpperCase() + domain.slice(1),
          icon: Shield,
          color: 'text-zinc-600 dark:text-zinc-400',
          badgeBg: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
        }
        groups[domain] = { domain, ...meta, actions: [] }
      }
      groups[domain].actions.push(action)
    })

    return Object.values(groups)
  }, [user?.permissions])

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-500">
          <Clock className="h-6 w-6 animate-spin text-blue-500" />
          <span>Synchronizing security context...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-16 min-w-0">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Account Command Center
            </h1>
            <Badge variant="primary" className="text-[10px] font-mono uppercase tracking-wider py-0 px-1.5">
              Production
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise identity credentials, multi-factor security policies, and RBAC governance.
          </p>
        </div>

        {/* Global Quick Action: Sign Out Everywhere */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLogoutAllOpen(true)}
          className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 self-start sm:self-auto shadow-2xs border-zinc-200/90 dark:border-white/10"
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
          <span>Terminate all sessions</span>
        </Button>
      </div>

      {/* Hero Profile Card with Glass Ambient Glow */}
      <div className="relative p-5 sm:p-7 rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111116]/90 backdrop-blur-xl shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_16px_40px_-8px_rgba(0,0,0,0.6)] overflow-hidden transition-all">
        {/* Subtle decorative glow behind avatar */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar with Status Ring */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-zinc-950 text-white flex items-center justify-center text-xl sm:text-2xl font-bold tracking-wider shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-[#111116]">
                {user.username ? user.username.slice(0, 2).toUpperCase() : 'VX'}
              </div>
              <span
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-3 border-white dark:border-[#111116] flex items-center justify-center shadow-xs"
                title="Active Identity"
              >
                <Check className="h-3 w-3 text-white stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.full_name || user.username}
                </h2>
                {user.email_verified && (
                  <Badge variant="success" dot pulse className="text-[10px] py-0.5 px-2 h-5 shrink-0">
                    Verified
                  </Badge>
                )}
                {user.roles && user.roles.length > 0 && (
                  <Badge variant="default" className="font-mono text-[10px] sm:text-[11px] px-2 py-0.5 uppercase tracking-wide">
                    {user.roles[0].replace('ROLE_', '')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span className="font-mono">@{user.username}</span>
                <span>&bull;</span>
                <span className="truncate">{user.email}</span>
                {!user.email_verified && (
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 select-none"
                  >
                    <Mail className="h-3 w-3" />
                    <span>Verify Email</span>
                  </button>
                )}
              </div>

              {/* User ID Quick Copy */}
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 font-mono">ID:</span>
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-zinc-200/80 dark:border-white/10 truncate max-w-[200px] sm:max-w-xs">
                  {user.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Profile Edit Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangeFullNameOpen(true)}
              className="h-8 text-xs font-medium"
            >
              Edit Name
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangePasswordOpen(true)}
              className="h-8 text-xs font-medium"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1 text-zinc-400" />
              Password
            </Button>
          </div>
        </div>
      </div>

      {/* Security Posture Health Score Banner */}
      <Card className="overflow-hidden border-blue-500/20 bg-gradient-to-r from-blue-500/[0.03] via-indigo-500/[0.02] to-transparent">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Security Posture Score: <span className={securityHealth.color}>{securityHealth.score}% ({securityHealth.level})</span>
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Evaluates hardware key compliance, multi-factor verification, and email ownership.
            </p>

            {/* Health Progress Track */}
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mt-3 max-w-md">
              <div
                className={`h-full rounded-full transition-all duration-700 ${securityHealth.bg}`}
                style={{ width: `${securityHealth.score}%` }}
              />
            </div>
          </div>

          {/* Security Checklist Pills */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {user.email_verified ? (
              <Badge variant="success" dot className="text-xs">Email Verified</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVerifyModalOpen(true)}
                className="h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
              >
                Verify Email (+25%)
              </Button>
            )}

            {(user.mfa_enabled || user.sms_mfa_enabled) ? (
              <Badge variant="success" dot className="text-xs">2FA Guarded</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/mfa')}
                className="h-7 text-xs border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
              >
                Enable 2FA (+25%)
              </Button>
            )}

            {user.passkey_enabled ? (
              <Badge variant="success" dot className="text-xs">Passkey Active</Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/passkeys')}
                className="h-7 text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
              >
                Add Passkey (+20%)
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 4 Modern Stat / Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Identity State */}
        <Card glow className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Identity Status</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {user.status || 'ACTIVE'}
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {user.roles?.length || 1} Role{user.roles?.length !== 1 ? 's' : ''} assigned
            </p>
          </div>
        </Card>

        {/* Card 2: 2FA Authentication */}
        <Card glow className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Two-Factor Auth</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {user.mfa_enabled ? 'TOTP Active' : user.sms_mfa_enabled ? 'SMS Active' : 'Disabled'}
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {user.mfa_enabled || user.sms_mfa_enabled ? 'Hardware / OTP Guarded' : 'Action recommended'}
            </p>
          </div>
        </Card>

        {/* Card 3: Passkeys / WebAuthn */}
        <Card glow className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">FIDO2 Passkeys</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Fingerprint className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {user.passkey_enabled ? 'Enabled' : 'None'}
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {user.passkey_enabled ? 'Biometric login available' : 'Passwordless security'}
            </p>
          </div>
        </Card>

        {/* Card 4: Last Sign In */}
        <Card glow className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Last Sign-In</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 block truncate">
              {formatDate(user.last_login_at)}
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Verified session token
            </p>
          </div>
        </Card>
      </div>

      {/* Segmented Section Tabs */}
      <div className="border-b border-zinc-200/80 dark:border-white/[0.08]">
        <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'profile' as const, label: 'Profile Details', icon: User },
            { id: 'security' as const, label: 'Security & Access', icon: ShieldCheck },
            { id: 'permissions' as const, label: 'Roles & Privileges', icon: Shield },
            { id: 'danger' as const, label: 'Danger Zone', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap select-none ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-blue-400 dark:text-blue-600' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <CardTitle>Profile Details</CardTitle>
            </div>
            <CardDescription>
              Personal identity information and contact endpoints associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-white/[0.06] text-xs sm:text-sm">
            {/* Full Name */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
                Full Name
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                  {user.full_name || 'Not provided'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangeFullNameOpen(true)}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  {user.full_name ? 'Change name' : 'Add name'}
                </Button>
              </div>
            </div>

            {/* Username */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
                Username
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">
                  @{user.username}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangeUsernameOpen(true)}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  Change username
                </Button>
              </div>
            </div>

            {/* Email Address */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                Email Address
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-900 dark:text-zinc-100 font-medium break-all">{user.email}</span>
                {user.email_verified ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified Primary
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
                      className="h-6 text-[11px] px-2 py-0 cursor-pointer"
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
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  Change email
                </Button>
              </div>
            </div>

            {/* Phone Number */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
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
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
                      title={showPhoneNumber ? 'Hide phone number' : 'Show phone number'}
                    >
                      {showPhoneNumber ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
                        className="h-6 text-[11px] px-2 py-0 cursor-pointer"
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
                    className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                  >
                    Change phone
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">No phone number attached</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangePhoneOpen(true)}
                    className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                  >
                    Add phone
                  </Button>
                </div>
              )}
            </div>

            {/* Created Timestamp */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                Member Since
              </span>
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                {formatDate(user.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Security & Access */}
      {activeTab === 'security' && (
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <CardTitle>Security &amp; Authentication Factors</CardTitle>
            </div>
            <CardDescription>
              Hardware passkeys, multi-factor policies, and credentials hardening
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-white/[0.06] text-xs sm:text-sm">
            {/* Two-Factor Authentication */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0">
                Two-Factor Authentication
              </span>
              <div className="flex items-center gap-2.5">
                {user.mfa_enabled ? (
                  <Badge variant="success" dot pulse className="text-xs">
                    Enabled (Authenticator App)
                  </Badge>
                ) : user.sms_mfa_enabled ? (
                  <Badge variant="success" dot pulse className="text-xs">
                    Enabled (SMS OTP)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <ShieldAlert className="h-3 w-3 text-zinc-400 mr-1" />
                    Not Configured
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/mfa')}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  Configure 2FA
                </Button>
              </div>
            </div>

            {/* Passkeys / WebAuthn */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
                <Fingerprint className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                Passkeys (FIDO2)
              </span>
              <div className="flex items-center gap-2.5">
                {user.passkey_enabled ? (
                  <Badge variant="success" dot className="text-xs">Active</Badge>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">None registered</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/passkeys')}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  {user.passkey_enabled ? 'Manage passkeys' : 'Register passkey'}
                </Button>
              </div>
            </div>

            {/* Connected OAuth Accounts */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                Connected Accounts
              </span>
              <div className="flex items-center gap-2.5">
                {(user.has_social_accounts || (user as any).hasSocialAccounts) ? (
                  <Badge variant="success" dot className="text-xs">Connected</Badge>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400 text-xs">None linked</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/connected-accounts')}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  Manage accounts
                </Button>
              </div>
            </div>

            {/* Password Management */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                Password Credentials
              </span>
              <div className="flex items-center gap-3">
                {(user.has_password === false || (user as any).hasPassword === false) ? (
                  <>
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs">Not configured</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                    >
                      Set password
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-zinc-500 tracking-widest text-xs">••••••••••••</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                    >
                      Change password
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Active Sessions Overview */}
            <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-44 shrink-0 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                Active Sessions
              </span>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/sessions')}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer"
                >
                  Inspect sessions
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLogoutAllOpen(true)}
                  className="h-6 text-[11px] px-2 py-0 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Sign out everywhere
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Roles & Privileges */}
      {activeTab === 'permissions' && (
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <CardTitle>Roles &amp; Effective Privileges</CardTitle>
              </div>
              {(hasPermission('permission:read') || user.roles?.includes('ROLE_ADMIN')) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/permissions')}
                  className="h-7 text-xs text-blue-600 dark:text-blue-400 gap-1 font-medium"
                >
                  <span>Permissions Directory</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
            <CardDescription>
              RBAC roles assigned to your identity and resolved domain capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Assigned Roles */}
            <div>
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
                Assigned RBAC Roles
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: string) => (
                    <Badge key={role} variant="default" className="font-mono text-xs px-3 py-1">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">No roles assigned</span>
                )}
              </div>
            </div>

            {/* Effective Permissions Grid */}
            {user.permissions && user.permissions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Domain Capabilities ({user.permissions.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedPermissions.map((group) => {
                    const GroupIcon = group.icon
                    return (
                      <div
                        key={group.domain}
                        className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02] space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className={`h-4 w-4 ${group.color}`} />
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {group.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                            {group.actions.length} action{group.actions.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {group.actions.map((act) => (
                            <span
                              key={act}
                              className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${group.badgeBg}`}
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No direct permissions resolved.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Danger Zone */}
      {activeTab === 'danger' && (
        <Card className="overflow-hidden border-red-200/80 dark:border-red-950/60 bg-red-500/[0.02] dark:bg-red-950/10">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-red-200/50 dark:border-red-900/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-600 dark:text-red-400">Account Termination Zone</CardTitle>
            </div>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Irreversible actions that affect your entire account, tokens, and data access
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 divide-y divide-red-200/50 dark:divide-red-900/30 space-y-4 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Permanently Delete Account
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
                  Initiates complete deletion of your identity record, invalidates all issued JWT tokens, revokes passkeys, and starts the 90-day retention grace cycle.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteAccountOpen(true)}
                className="shrink-0 text-xs px-3 h-8 shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Delete Account</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals & Dialogs */}
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

      <ChangeFullNameModal
        isOpen={isChangeFullNameOpen}
        onClose={() => setIsChangeFullNameOpen(false)}
        currentFullName={user.full_name}
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

      {user.username && (
        <DeleteAccountModal
          isOpen={isDeleteAccountOpen}
          onClose={() => setIsDeleteAccountOpen(false)}
          username={user.username}
        />
      )}
    </div>
  )
}
