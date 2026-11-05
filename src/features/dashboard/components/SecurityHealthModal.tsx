import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  Mail,
  Smartphone,
  Fingerprint,
  Shield,
  Link2,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/types/api'

interface SecurityHealthModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
  onVerifyEmail: () => void
  onVerifyPhone: () => void
}

interface ChecklistItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  weight: number
  isComplete: boolean
  actionLabel: string
  onAction: () => void
}

export const SecurityHealthModal: React.FC<SecurityHealthModalProps> = ({
  isOpen,
  onClose,
  user,
  onVerifyEmail,
  onVerifyPhone,
}) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const items: ChecklistItem[] = [
    {
      id: 'email',
      title: 'Primary Email Verification',
      description: 'Guarantees account recovery notifications and security audit alerts reach you.',
      icon: <Mail className="h-5 w-5 text-blue-500" />,
      weight: 20,
      isComplete: Boolean(user.email_verified),
      actionLabel: 'Verify Email',
      onAction: () => {
        onClose()
        onVerifyEmail()
      },
    },
    {
      id: 'phone',
      title: 'Registered Mobile Phone',
      description: 'Used for SMS two-factor challenges and out-of-band account recovery.',
      icon: <Smartphone className="h-5 w-5 text-emerald-500" />,
      weight: 15,
      isComplete: Boolean(user.phone_number && user.phone_number_verified),
      actionLabel: 'Verify Phone',
      onAction: () => {
        onClose()
        onVerifyPhone()
      },
    },
    {
      id: 'passkey',
      title: 'FIDO2 Hardware Passkeys',
      description: 'Phishing-resistant biometric or hardware security key (YubiKey, Touch ID, Windows Hello).',
      icon: <Fingerprint className="h-5 w-5 text-purple-500" />,
      weight: 25,
      isComplete: Boolean(user.passkey_enabled),
      actionLabel: 'Register Passkey',
      onAction: () => {
        onClose()
        navigate('/passkeys')
      },
    },
    {
      id: '2fa',
      title: 'Two-Factor Authentication',
      description: 'Time-based One-Time Passcodes (TOTP) or SMS verification codes required at login.',
      icon: <Shield className="h-5 w-5 text-indigo-500" />,
      weight: 25,
      isComplete: Boolean(user.mfa_enabled || user.sms_mfa_enabled),
      actionLabel: 'Configure 2FA',
      onAction: () => {
        onClose()
        navigate('/mfa')
      },
    },
    {
      id: 'social',
      title: 'Federated Identity Linking',
      description: 'Connect Google or GitHub OAuth2 for single sign-on and alternate login paths.',
      icon: <Link2 className="h-5 w-5 text-amber-500" />,
      weight: 10,
      isComplete: Boolean(user.has_social_accounts),
      actionLabel: 'Connect Accounts',
      onAction: () => {
        onClose()
        navigate('/connected-accounts')
      },
    },
    {
      id: 'recovery',
      title: 'Emergency Recovery Codes',
      description: 'Single-use backup codes stored offline in case of device loss.',
      icon: <KeyRound className="h-5 w-5 text-rose-500" />,
      weight: 5,
      isComplete: Boolean(user.mfa_enabled || user.sms_mfa_enabled),
      actionLabel: 'View Codes',
      onAction: () => {
        onClose()
        navigate('/mfa')
      },
    },
  ]

  const totalScore = items.reduce((acc, curr) => (curr.isComplete ? acc + curr.weight : acc), 0)
  const completedCount = items.filter((i) => i.isComplete).length

  const getPostureBadge = (score: number) => {
    if (score >= 80) return { label: 'Maximum Posture', variant: 'success' as const }
    if (score >= 50) return { label: 'Strong Posture', variant: 'warning' as const }
    return { label: 'Attention Needed', variant: 'destructive' as const }
  }

  const posture = getPostureBadge(totalScore)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
                Security Posture &amp; Compliance Audit
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              Enterprise security benchmark based on hardware keys, multi-factor authentication, and account recovery.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Score Overview */}
        <div className="p-5 sm:p-6 bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-extrabold text-zinc-950 dark:text-white font-mono">
                {totalScore}%
              </span>
              <Badge variant={posture.variant} dot className="text-xs font-bold px-2.5 py-0.5">
                {posture.label}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {completedCount} of {items.length} identity security controls fulfilled
            </p>
          </div>

          <div className="w-36 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${totalScore}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {items.map((item) => (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  {item.icon}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-zinc-400">
                      +{item.weight}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-center">
                {item.isComplete ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Active</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={item.onAction}
                    className="h-8 px-3 text-xs font-semibold border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer shadow-2xs"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c0c0e] flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Scores above 80% meet Enterprise Zero-Trust standards
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="h-8 px-4 text-xs font-bold cursor-pointer"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
