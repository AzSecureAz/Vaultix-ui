import { useState, useEffect } from 'react'
import {
  Smartphone,
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { VerifyPhoneModal } from '@/features/dashboard/components/VerifyPhoneModal'
import { ChangePhoneNumberModal } from '@/features/dashboard/components/ChangePhoneNumberModal'
import { maskPhoneNumber } from '@/lib/utils'
import type { TotpSetupData } from '@/types/api'

export function MfaPage() {
  const { user, fetchProfile } = useAuthStore()

  const [setupData, setSetupData] = useState<TotpSetupData | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedAllCodes, setCopiedAllCodes] = useState(false)
  const [activationError, setActivationError] = useState<string | null>(null)
  const [showSmsPhone, setShowSmsPhone] = useState(false)

  /* Dialog states */
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false)

  /* SMS MFA States */
  const [isSmsSetupOpen, setIsSmsSetupOpen] = useState(false)
  const [smsVerificationCode, setSmsVerificationCode] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsActivating, setSmsActivating] = useState(false)
  const [smsDisabling, setSmsDisabling] = useState(false)
  const [smsError, setSmsError] = useState<string | null>(null)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [isDisableSmsDialogOpen, setIsDisableSmsDialogOpen] = useState(false)
  const [isVerifyPhoneOpen, setIsVerifyPhoneOpen] = useState(false)
  const [isAddPhoneOpen, setIsAddPhoneOpen] = useState(false)

  /* Countdown timer for SMS setup resend */
  useEffect(() => {
    if (smsCountdown <= 0) return
    const timer = setInterval(() => {
      setSmsCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [smsCountdown])

  /* Fetch remaining recovery codes count when any MFA factor is active */
  useEffect(() => {
    if (user?.mfa_enabled || user?.sms_mfa_enabled) {
      loadRecoveryCodesCount()
    } else {
      setRemainingCodes(null)
    }
  }, [user?.mfa_enabled, user?.sms_mfa_enabled])

  const loadRecoveryCodesCount = async () => {
    try {
      const res = await authApi.getRemainingRecoveryCodes()
      if (res.success && typeof res.data === 'number') {
        setRemainingCodes(res.data)
      }
    } catch {
      /* Ignore if not available */
    }
  }

  /* Step 1: Initiate Setup (Generates unverified TOTP secret & QR code) */
  const initiateSetup = async () => {
    setLoading(true)
    setActivationError(null)
    try {
      const res = await authApi.setupTotp()
      if (res.success && res.data) {
        setSetupData(res.data)
        setVerificationCode('')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initiate authenticator setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* Step 2: Verify & Activate TOTP */
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = verificationCode.trim().replace(/\D/g, '')
    if (cleanCode.length !== 6) {
      setActivationError('Please enter a valid 6-digit verification code')
      return
    }

    setActivating(true)
    setActivationError(null)

    try {
      const res = await authApi.activateTotp(cleanCode)
      if (res.success) {
        toast.success('Two-factor authentication is now active on your account.')
        const codes = res.data?.recovery_codes || res.data?.recoveryCodes || []
        setRecoveryCodes(codes)
        setRemainingCodes(codes.length)
        setSetupData(null)
        setVerificationCode('')
        await fetchProfile()
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Invalid 6-digit code. Please verify the code in your app.'
      setActivationError(errMsg)
    } finally {
      setActivating(false)
    }
  }

  /* SMS MFA Handlers */
  const handleInitiateSmsSetup = async () => {
    setSmsSending(true)
    setSmsError(null)
    try {
      const res = await authApi.sendSmsMfaSetupOtp()
      if (res.success) {
        setIsSmsSetupOpen(true)
        setSmsVerificationCode('')
        setSmsCountdown(60)
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to dispatch SMS setup code. Please try again.'
      toast.error(errMsg)
    } finally {
      setSmsSending(false)
    }
  }

  const handleActivateSmsMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = smsVerificationCode.trim().replace(/\D/g, '')
    if (cleanCode.length !== 6) {
      setSmsError('Please enter a valid 6-digit verification code')
      return
    }

    setSmsActivating(true)
    setSmsError(null)

    try {
      const res = await authApi.enableSmsMfa(cleanCode)
      if (res.success) {
        toast.success('SMS two-factor authentication is now active on your account.')
        const codes = res.data?.recovery_codes || res.data?.recoveryCodes || []
        if (codes.length > 0) {
          setRecoveryCodes(codes)
          setRemainingCodes(codes.length)
        }
        setIsSmsSetupOpen(false)
        setSmsVerificationCode('')
        await fetchProfile()
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Invalid 6-digit code. Please verify the code in your SMS.'
      setSmsError(errMsg)
    } finally {
      setSmsActivating(false)
    }
  }

  const handleDisableSmsMfa = async () => {
    setSmsDisabling(true)
    try {
      const res = await authApi.disableSmsMfa()
      if (res.success) {
        toast.success('SMS two-factor authentication has been disabled.')
        setIsDisableSmsDialogOpen(false)
        await fetchProfile()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to disable SMS 2FA. Please try again.')
    } finally {
      setSmsDisabling(false)
    }
  }

  const handleDisableTotp = async () => {
    setDisabling(true)

    try {
      await authApi.disableTotp()
      toast.success('Two-factor authentication has been disabled successfully.')
      setIsDisableDialogOpen(false)
      setSetupData(null)
      setRecoveryCodes([])
      setRemainingCodes(null)
      await fetchProfile()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to disable two-factor authentication.')
    } finally {
      setDisabling(false)
    }
  }

  /* Step 4: Regenerate Recovery Codes */
  const handleRegenerateCodes = async () => {
    setRegenerating(true)

    try {
      const res = await authApi.regenerateRecoveryCodes()
      if (res.success) {
        const codes = res.data?.recovery_codes || res.data?.recoveryCodes || []
        setRecoveryCodes(codes)
        setRemainingCodes(codes.length)
        toast.success('New emergency recovery codes have been generated. Previous codes have been invalidated.')
        setIsRegenerateDialogOpen(false)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to regenerate emergency recovery codes.')
    } finally {
      setRegenerating(false)
    }
  }

  const copySecret = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const copyAllCodes = () => {
    if (recoveryCodes.length > 0) {
      navigator.clipboard.writeText(recoveryCodes.join('\n'))
      setCopiedAllCodes(true)
      setTimeout(() => setCopiedAllCodes(false), 2000)
    }
  }

  const otpUrl = setupData?.otpauth_url || setupData?.otpauthUrl
  const qrImageSrc = otpUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpUrl)}&size=180x180&margin=8`
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Two-Step Verification
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Add an extra layer of security to your account by requiring an authorized second factor when signing in.
        </p>
      </div>

      {/* Emergency Recovery Codes Display (Shown on activation or regeneration) */}
      {recoveryCodes.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 animate-in fade-in-0 duration-150">
          <CardHeader className="pb-3 border-b border-amber-200/50 dark:border-amber-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Emergency Recovery Codes
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllCodes}
                className="h-7 text-xs border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
              >
                {copiedAllCodes ? (
                  <Check className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                <span>{copiedAllCodes ? 'Copied' : 'Copy All'}</span>
              </Button>
            </div>
            <CardDescription className="text-xs text-amber-700 dark:text-amber-300/80">
              Save these one-time codes in a safe place. If you ever lose access to your device, each code can be redeemed once.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900/90 p-2 rounded-lg border border-amber-500/20 text-center font-semibold text-amber-900 dark:text-amber-100 select-all"
                >
                  {code}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Setup Flow */}
      {setupData && (
        <Card className="border-zinc-200 dark:border-zinc-800/80 animate-in fade-in-0 zoom-in-95 duration-150">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">Set Up Authenticator App</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSetupData(null)
                  setVerificationCode('')
                  setActivationError(null)
                }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CardDescription>
              Scan the barcode with Google Authenticator, 1Password, or Authy, then enter the 6-digit code.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
              {qrImageSrc ? (
                <div className="p-2 bg-white rounded-xl shadow-xs border border-zinc-200 shrink-0">
                  <img
                    src={qrImageSrc}
                    alt="Authenticator QR Code"
                    className="w-40 h-40"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
                  <Smartphone className="h-10 w-10" />
                </div>
              )}

              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                    Manual Secret Key
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold break-all select-all">
                      {setupData.secret || '—'}
                    </code>
                    {setupData.secret && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copySecret(setupData.secret!)}
                        className="h-8 px-2 text-xs shrink-0 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Open your authenticator app, tap <strong>Add account</strong> &bull; <strong>Scan a QR code</strong> (or manually enter the secret key above), then enter the 6-digit confirmation code below.
                </p>
              </div>
            </div>

            <form onSubmit={handleActivate} className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  6-Digit Verification Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setVerificationCode(val)
                    if (activationError) setActivationError(null)
                  }}
                  autoFocus
                  className={`font-mono text-center tracking-[0.4em] text-lg font-semibold h-12 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 transition-all ${
                    activationError
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
                {activationError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{activationError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSetupData(null)
                    setVerificationCode('')
                    setActivationError(null)
                  }}
                  className="w-1/3 text-xs h-10 rounded-lg cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={activating || verificationCode.length < 6}
                  className="flex-1 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm cursor-pointer"
                >
                  {activating ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Activating...</span>
                    </span>
                  ) : (
                    <span>Verify &amp; Activate</span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active SMS MFA Setup Flow */}
      {isSmsSetupOpen && (
        <Card className="border-zinc-200 dark:border-zinc-800/80 animate-in fade-in-0 zoom-in-95 duration-150">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-zinc-500" />
                <CardTitle className="text-sm font-semibold">Set Up SMS Two-Factor Authentication</CardTitle>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSmsSetupOpen(false)
                  setSmsVerificationCode('')
                  setSmsError(null)
                }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CardDescription className="flex items-center gap-1.5 flex-wrap">
              <span>We sent a 6-digit verification code to</span>
              <span className="inline-flex items-center gap-1 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                <span>{showSmsPhone ? user?.phone_number : maskPhoneNumber(user?.phone_number)}</span>
                <button
                  type="button"
                  onClick={() => setShowSmsPhone(!showSmsPhone)}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                  aria-label={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                >
                  {showSmsPhone ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </span>
              <span>. Enter the code below to enable SMS 2FA.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex-1 text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                <span>Verification code dispatched to</span>
                <span className="inline-flex items-center gap-1 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                  <span>{showSmsPhone ? user?.phone_number : maskPhoneNumber(user?.phone_number)}</span>
                  <button
                    type="button"
                    onClick={() => setShowSmsPhone(!showSmsPhone)}
                    className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                    aria-label={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                  >
                    {showSmsPhone ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
                <span>. Code expires in 5 minutes.</span>
              </div>
              {smsCountdown > 0 ? (
                <span className="text-xs text-zinc-400 font-mono shrink-0">
                  Resend in {smsCountdown}s
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInitiateSmsSetup}
                  disabled={smsSending}
                  className="text-xs h-8 px-3 rounded-lg shrink-0 cursor-pointer"
                >
                  {smsSending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  <span>Resend Code</span>
                </Button>
              )}
            </div>

            <form onSubmit={handleActivateSmsMfa} className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  6-Digit SMS Verification Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={smsVerificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setSmsVerificationCode(val)
                    if (smsError) setSmsError(null)
                  }}
                  autoFocus
                  className={`font-mono text-center tracking-[0.4em] text-lg font-semibold h-12 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 transition-all ${
                    smsError
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
                {smsError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{smsError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSmsSetupOpen(false)
                    setSmsVerificationCode('')
                    setSmsError(null)
                  }}
                  className="w-1/3 text-xs h-10 rounded-lg cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={smsActivating || smsVerificationCode.length < 6}
                  className="flex-1 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm cursor-pointer"
                >
                  {smsActivating ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Activating...</span>
                    </span>
                  ) : (
                    <span>Verify &amp; Activate</span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Available Verification Factors (Clerk Style) */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <CardTitle className="text-sm font-semibold">Available Verification Factors</CardTitle>
          <CardDescription>
            Supported second factors configured for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs sm:text-sm">
          {/* Factor 1: Authenticator App */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <Smartphone className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Authenticator application
                  </span>
                  {user?.mfa_enabled ? (
                    <Badge variant="success" dot pulse className="text-[10px] py-0 px-2 h-5">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Google Authenticator, Microsoft Authenticator, 1Password, or Authy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user?.mfa_enabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDisableDialogOpen(true)}
                  disabled={disabling}
                  className="text-xs h-8 px-3 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40 cursor-pointer"
                >
                  {disabling ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  <span>Disable</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={initiateSetup}
                  disabled={loading || !!setupData}
                  className="text-xs h-8 px-3.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm cursor-pointer"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  <span>Set Up</span>
                </Button>
              )}
            </div>
          </div>

          {/* Factor 2: SMS Text Message */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    SMS text message
                  </span>
                  {user?.sms_mfa_enabled ? (
                    <Badge variant="success" dot pulse className="text-[10px] py-0 px-2 h-5">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">
                      Disabled
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {user?.sms_mfa_enabled
                      ? 'Verification codes are sent to'
                      : user?.phone_number && user?.phone_number_verified
                      ? 'Send one-time passcodes to'
                      : user?.phone_number && !user?.phone_number_verified
                      ? 'Phone number'
                      : 'No phone number registered. Add and verify a phone number first to enable SMS 2FA.'}
                  </span>
                  {user?.phone_number && (
                    <span className="inline-flex items-center gap-1 font-mono text-zinc-800 dark:text-zinc-200">
                      <span>{showSmsPhone ? user.phone_number : maskPhoneNumber(user.phone_number)}</span>
                      <button
                        type="button"
                        onClick={() => setShowSmsPhone(!showSmsPhone)}
                        className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                        aria-label={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                      >
                        {showSmsPhone ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                    </span>
                  )}
                  {user?.phone_number && (
                    <span>
                      {user?.sms_mfa_enabled
                        ? ''
                        : user?.phone_number_verified
                        ? 'upon sign-in'
                        : 'is unverified. Verify it first to enable SMS 2FA.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {user?.sms_mfa_enabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDisableSmsDialogOpen(true)}
                  disabled={smsDisabling}
                  className="text-xs h-8 px-3 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40 cursor-pointer"
                >
                  {smsDisabling ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  <span>Disable</span>
                </Button>
              ) : user?.phone_number && user?.phone_number_verified ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleInitiateSmsSetup}
                  disabled={smsSending || isSmsSetupOpen}
                  className="text-xs h-8 px-3.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm cursor-pointer"
                >
                  {smsSending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  <span>Set Up</span>
                </Button>
              ) : user?.phone_number && !user?.phone_number_verified ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVerifyPhoneOpen(true)}
                  className="text-xs h-8 px-3.5 rounded-lg border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer"
                >
                  <span>Verify Phone</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddPhoneOpen(true)}
                  className="text-xs h-8 px-3.5 rounded-lg cursor-pointer"
                >
                  <span>Add Phone</span>
                </Button>
              )}
            </div>
          </div>

          {/* Factor 3: Emergency Recovery Codes (Visible when any MFA is Active) */}
          {(user?.mfa_enabled || user?.sms_mfa_enabled) && (
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Emergency recovery codes
                    </span>
                    {remainingCodes !== null && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 font-mono">
                        {remainingCodes} remaining
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Use one-time backup codes if you lose access to your primary 2FA method
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRegenerateDialogOpen(true)}
                disabled={regenerating}
                className="text-xs h-8 px-3 rounded-lg cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                <span>Regenerate codes</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable Confirmation Modal */}
      {isDisableDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => !disabling && setIsDisableDialogOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Disable Two-Factor Authentication?
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This will remove your authenticator app verification factor and delete all emergency recovery codes. Your account will only be protected by your password.
              </p>
            </div>

            <div className="flex gap-2.5 pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={disabling}
                onClick={() => setIsDisableDialogOpen(false)}
                className="w-1/2 text-xs h-10 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={disabling}
                onClick={handleDisableTotp}
                className="w-1/2 text-xs h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
              >
                {disabling ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Disabling...</span>
                  </span>
                ) : (
                  <span>Disable 2FA</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Recovery Codes Confirmation Modal */}
      {isRegenerateDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => !regenerating && setIsRegenerateDialogOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Regenerate Emergency Recovery Codes?
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Generating new recovery codes will immediately invalidate any unused codes you previously saved. Make sure to save the new codes safely.
              </p>
            </div>

            <div className="flex gap-2.5 pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={regenerating}
                onClick={() => setIsRegenerateDialogOpen(false)}
                className="w-1/2 text-xs h-10 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={regenerating}
                onClick={handleRegenerateCodes}
                className="w-1/2 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm cursor-pointer"
              >
                {regenerating ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating...</span>
                  </span>
                ) : (
                  <span>Regenerate Codes</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Disable SMS MFA Confirmation Modal */}
      {isDisableSmsDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => !smsDisabling && setIsDisableSmsDialogOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Disable SMS Two-Factor Authentication?
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This will remove SMS one-time passcodes as a second factor for your account.
              </p>
            </div>

            <div className="flex gap-2.5 pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={smsDisabling}
                onClick={() => setIsDisableSmsDialogOpen(false)}
                className="w-1/2 text-xs h-10 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={smsDisabling}
                onClick={handleDisableSmsMfa}
                className="w-1/2 text-xs h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
              >
                {smsDisabling ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Disabling...</span>
                  </span>
                ) : (
                  <span>Disable SMS 2FA</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Management Modals */}
      <VerifyPhoneModal
        isOpen={isVerifyPhoneOpen}
        onClose={() => setIsVerifyPhoneOpen(false)}
        phoneNumber={user?.phone_number || ''}
      />

      <ChangePhoneNumberModal
        isOpen={isAddPhoneOpen}
        onClose={() => setIsAddPhoneOpen(false)}
        currentPhoneNumber={user?.phone_number}
      />
    </div>
  )
}
