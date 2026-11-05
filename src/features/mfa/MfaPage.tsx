import { useState, useEffect } from 'react'
import {
  Smartphone,
  KeyRound,
  Copy,
  Check,
  Download,
  Printer,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
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


  const downloadBackupSheet = () => {
    if (recoveryCodes.length === 0) return
    const text = `=====================================================
VAULTIX ENTERPRISE IAM - EMERGENCY RECOVERY CODES
=====================================================
Account: ${user?.email || user?.username || 'Authenticated User'}
Generated: ${new Date().toLocaleString()}
Important: Each emergency recovery code can be used once. Keep
this document strictly offline in a secure, confidential place.
-----------------------------------------------------
${recoveryCodes.map((c, i) => `[${i + 1 < 10 ? ' ' : ''}${i + 1}]  ${c}`).join('\n')}
-----------------------------------------------------
Security Note: If these codes are lost or exposed, immediately
visit your Vaultix Account Console and regenerate them.
=====================================================`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vaultix-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Emergency recovery codes downloaded as backup document.')
  }

  const printBackupSheet = () => {
    window.print()
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
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpUrl)}&size=200x200&margin=8`
    : null

  return (
    <div className="space-y-7 sm:space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
          <ShieldCheck className="h-4 w-4" />
          <span>Security &bull; Multi-Factor Authentication</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Two-Step Verification
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-medium">
          Add an extra layer of security to your account by requiring an authorized second factor (TOTP Authenticator or SMS OTP) when signing in.
        </p>
      </div>

      {/* Emergency Recovery Codes Display (Shown on activation or regeneration) */}
      {recoveryCodes.length > 0 && (
        <Card className="border-2 border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/25 rounded-3xl overflow-hidden shadow-sm animate-in fade-in-0 duration-200">
          <CardHeader className="p-6 sm:p-7 pb-4 border-b border-amber-200/60 dark:border-amber-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-amber-950 dark:text-amber-100">
                    Emergency Recovery Codes
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-amber-800/80 dark:text-amber-300/80 font-medium">
                    Save these one-time codes in a password manager. Each code can be redeemed once if you lose device access.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Button
                  variant="outline"
                  size="default"
                  onClick={downloadBackupSheet}
                  className="h-9 px-3.5 text-xs sm:text-sm font-bold border-amber-400 dark:border-amber-700 bg-white dark:bg-zinc-800 text-amber-950 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 rounded-xl cursor-pointer shadow-xs"
                  title="Download emergency codes document"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  <span>Download</span>
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={printBackupSheet}
                  className="h-9 px-3.5 text-xs sm:text-sm font-bold border-amber-400 dark:border-amber-700 bg-white dark:bg-zinc-800 text-amber-950 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 rounded-xl cursor-pointer shadow-xs"
                  title="Print recovery codes sheet"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  <span>Print</span>
                </Button>

                <Button
                variant="outline"
                size="default"
                onClick={copyAllCodes}
                className="h-9 px-4 text-xs sm:text-sm font-bold border-amber-400 dark:border-amber-700 bg-white dark:bg-zinc-800 text-amber-950 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 rounded-xl cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
              >
                {copiedAllCodes ? (
                  <Check className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 mr-1.5" />
                )}
                <span>{copiedAllCodes ? 'Copied' : 'Copy All Codes'}</span>
              </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-sm sm:text-base font-bold">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900/90 py-2.5 px-3 rounded-xl border border-amber-500/30 text-center font-bold text-amber-950 dark:text-amber-100 select-all shadow-2xs tracking-wider"
                >
                  {code}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active TOTP Setup Flow */}
      {setupData && (
        <Card className="border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-[#111116] overflow-hidden shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
          <CardHeader className="p-6 sm:p-7 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                    Set Up Authenticator Application
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    Scan the QR code with Google Authenticator, 1Password, or Authy, then enter the 6-digit code.
                  </CardDescription>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSetupData(null)
                  setVerificationCode('')
                  setActivationError(null)
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              {qrImageSrc ? (
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-200 shrink-0">
                  <img
                    src={qrImageSrc}
                    alt="Authenticator QR Code"
                    className="w-44 h-44 rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <Smartphone className="h-12 w-12" />
                </div>
              )}

              <div className="space-y-3.5 flex-1 min-w-0">
                <div>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-1.5">
                    Manual Secret Key
                  </span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <code className="text-sm font-mono bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white font-bold break-all select-all shadow-2xs">
                      {setupData.secret || '—'}
                    </code>
                    {setupData.secret && (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        onClick={() => copySecret(setupData.secret!)}
                        className="h-10 px-3 text-xs sm:text-sm font-bold rounded-xl border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shrink-0 cursor-pointer shadow-xs active:scale-95"
                        title="Copy Key"
                      >
                        {copiedKey ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">{copiedKey ? 'Copied' : 'Copy'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  Open your authenticator app, tap <strong className="font-bold text-zinc-950 dark:text-white">Add account</strong> &bull; <strong className="font-bold text-zinc-950 dark:text-white">Scan a QR code</strong> (or manually enter the secret key above), then enter the 6-digit confirmation code below.
                </p>
              </div>
            </div>

            <form onSubmit={handleActivate} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
                  className={`font-mono text-center tracking-[0.4em] text-xl sm:text-2xl font-bold h-12 sm:h-14 rounded-xl border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 transition-all ${activationError
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                      : ''
                    }`}
                />
                {activationError && (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{activationError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSetupData(null)
                    setVerificationCode('')
                    setActivationError(null)
                  }}
                  className="w-1/3 text-sm font-bold h-11 sm:h-12 rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={activating || verificationCode.length < 6}
                  className="flex-1 text-sm sm:text-base font-bold h-11 sm:h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  {activating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
        <Card className="border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-white dark:bg-[#111116] overflow-hidden shadow-sm animate-in fade-in-0 zoom-in-95 duration-200">
          <CardHeader className="p-6 sm:p-7 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                    Set Up SMS Two-Factor Authentication
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    We dispatched a 6-digit verification code to your verified phone number.
                  </CardDescription>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSmsSetupOpen(false)
                  setSmsVerificationCode('')
                  setSmsError(null)
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                <Phone className="h-6 w-6" />
              </div>
              <div className="flex-1 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2 flex-wrap">
                <span>Verification code dispatched to</span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-950 dark:text-zinc-100 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700">
                  <span>{showSmsPhone ? user?.phone_number : maskPhoneNumber(user?.phone_number)}</span>
                  <button
                    type="button"
                    onClick={() => setShowSmsPhone(!showSmsPhone)}
                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer rounded"
                    title={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                  >
                    {showSmsPhone ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
                <span>(expires in 5 minutes).</span>
              </div>
              {smsCountdown > 0 ? (
                <span className="text-xs sm:text-sm font-bold text-zinc-500 font-mono shrink-0">
                  Resend in {smsCountdown}s
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleInitiateSmsSetup}
                  disabled={smsSending}
                  className="text-xs sm:text-sm h-9 px-4 font-bold rounded-xl border-zinc-300 dark:border-zinc-700 shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  {smsSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  <span>Resend Code</span>
                </Button>
              )}
            </div>

            <form onSubmit={handleActivateSmsMfa} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
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
                  className={`font-mono text-center tracking-[0.4em] text-xl sm:text-2xl font-bold h-12 sm:h-14 rounded-xl border-zinc-300 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 transition-all ${smsError
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                      : ''
                    }`}
                />
                {smsError && (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold flex items-center justify-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{smsError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSmsSetupOpen(false)
                    setSmsVerificationCode('')
                    setSmsError(null)
                  }}
                  className="w-1/3 text-sm font-bold h-11 sm:h-12 rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={smsActivating || smsVerificationCode.length < 6}
                  className="flex-1 text-sm sm:text-base font-bold h-11 sm:h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  {smsActivating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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

      {/* Available Verification Factors Card */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-[#111116]">
        <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5 border-b border-zinc-200 dark:border-zinc-800">
          <CardTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
            Configured Verification Factors
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Multi-factor authentication mechanisms enabled for your account credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* Factor 1: Authenticator App */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-white shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                <Smartphone className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-bold text-zinc-950 dark:text-white">
                    Authenticator application (TOTP)
                  </span>
                  {user?.mfa_enabled ? (
                    <Badge variant="success" dot pulse className="text-xs py-0.5 px-2.5 font-semibold">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs py-0.5 px-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                  Google Authenticator, Microsoft Authenticator, 1Password, or Authy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {user?.mfa_enabled ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsDisableDialogOpen(true)}
                  disabled={disabling}
                  className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shadow-xs active:scale-95"
                >
                  {disabling ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  <span>Disable 2FA</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="default"
                  onClick={initiateSetup}
                  disabled={loading || !!setupData}
                  className="h-10 px-5 text-xs sm:text-sm font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer active:scale-95"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  <span>Set Up Authenticator</span>
                </Button>
              )}
            </div>
          </div>

          {/* Factor 2: SMS Text Message */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-white shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                <MessageSquare className="h-6 w-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-bold text-zinc-950 dark:text-white">
                    SMS text message (OTP)
                  </span>
                  {user?.sms_mfa_enabled ? (
                    <Badge variant="success" dot pulse className="text-xs py-0.5 px-2.5 font-semibold">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs py-0.5 px-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                      Disabled
                    </Badge>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1.5 flex-wrap">
                  <span>
                    {user?.sms_mfa_enabled
                      ? 'Verification codes are sent to'
                      : user?.phone_number && user?.phone_number_verified
                        ? 'Send one-time passcodes to'
                        : user?.phone_number && !user?.phone_number_verified
                          ? 'Phone number'
                          : 'No phone number attached. Add and verify a phone number first to enable SMS 2FA.'}
                  </span>
                  {user?.phone_number && (
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      <span>{showSmsPhone ? user.phone_number : maskPhoneNumber(user.phone_number)}</span>
                      <button
                        type="button"
                        onClick={() => setShowSmsPhone(!showSmsPhone)}
                        className="p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer rounded"
                        title={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                      >
                        {showSmsPhone ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </span>
                  )}
                  {user?.phone_number && (
                    <span>
                      {user?.sms_mfa_enabled
                        ? ''
                        : user?.phone_number_verified
                          ? 'upon sign-in.'
                          : 'is unverified. Verify it first to enable SMS 2FA.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {user?.sms_mfa_enabled ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsDisableSmsDialogOpen(true)}
                  disabled={smsDisabling}
                  className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shadow-xs active:scale-95"
                >
                  {smsDisabling ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  <span>Disable SMS 2FA</span>
                </Button>
              ) : user?.phone_number && user?.phone_number_verified ? (
                <Button
                  variant="default"
                  size="default"
                  onClick={handleInitiateSmsSetup}
                  disabled={smsSending || isSmsSetupOpen}
                  className="h-10 px-5 text-xs sm:text-sm font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer active:scale-95"
                >
                  {smsSending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  <span>Set Up SMS 2FA</span>
                </Button>
              ) : user?.phone_number && !user?.phone_number_verified ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsVerifyPhoneOpen(true)}
                  className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Verify Phone</span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsAddPhoneOpen(true)}
                  className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shadow-xs active:scale-95"
                >
                  <span>Add Phone</span>
                </Button>
              )}
            </div>
          </div>

          {/* Factor 3: Emergency Recovery Codes (Visible when any MFA is Active) */}
          {(user?.mfa_enabled || user?.sms_mfa_enabled) && (
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-white shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <KeyRound className="h-6 w-6 stroke-[1.8]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-bold text-zinc-950 dark:text-white">
                      Emergency recovery codes
                    </span>
                    {remainingCodes !== null && (
                      <Badge
                        variant={remainingCodes <= 3 ? 'destructive' : 'outline'}
                        className="text-xs py-0.5 px-2 font-mono font-bold"
                      >
                        {remainingCodes <= 3 ? `⚠️ Low (${remainingCodes} remaining)` : `${remainingCodes} remaining`}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                    Use one-time emergency backup keys if you lose physical access to your authenticator or mobile device.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="default"
                onClick={() => setIsRegenerateDialogOpen(true)}
                disabled={regenerating}
                className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shadow-xs active:scale-95 shrink-0 self-end sm:self-center"
              >
                <RefreshCw className="h-4 w-4 mr-1.5 text-zinc-500" />
                <span>Regenerate Codes</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable TOTP Confirmation Modal */}
      {isDisableDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 text-zinc-950 dark:text-zinc-50 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-xs">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Disable Two-Factor Authentication?
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                This will remove your authenticator app factor and delete all emergency recovery codes. Your account will only be protected by your password.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={disabling}
                onClick={() => setIsDisableDialogOpen(false)}
                className="h-11 sm:h-12 px-5 text-sm sm:text-base font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={disabling}
                onClick={handleDisableTotp}
                className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer active:scale-95 transition-all"
              >
                {disabling ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 text-zinc-950 dark:text-zinc-50 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
                <KeyRound className="h-7 w-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Regenerate Emergency Recovery Codes?
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                Generating new recovery codes will immediately invalidate any unused codes you previously saved. Make sure to copy and store the new codes in a secure vault.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={regenerating}
                onClick={() => setIsRegenerateDialogOpen(false)}
                className="h-11 sm:h-12 px-5 text-sm sm:text-base font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={regenerating}
                onClick={handleRegenerateCodes}
                className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                {regenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 text-zinc-950 dark:text-zinc-50 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-xs">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Disable SMS Two-Factor Authentication?
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                This will remove SMS one-time passcodes sent to{' '}
                {user?.phone_number && (
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-950 dark:text-white">
                    <span>{showSmsPhone ? user.phone_number : maskPhoneNumber(user.phone_number)}</span>
                    <button
                      type="button"
                      onClick={() => setShowSmsPhone(!showSmsPhone)}
                      className="p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer rounded"
                      title={showSmsPhone ? 'Hide phone number' : 'Show phone number'}
                    >
                      {showSmsPhone ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </span>
                )}{' '}
                as a second factor for your account. You will rely on your authenticator app or hardware keys.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={smsDisabling}
                onClick={() => setIsDisableSmsDialogOpen(false)}
                className="h-11 sm:h-12 px-5 text-sm sm:text-base font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={smsDisabling}
                onClick={handleDisableSmsMfa}
                className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer active:scale-95 transition-all"
              >
                {smsDisabling ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
