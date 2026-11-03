import { useState, useEffect, useCallback } from 'react'
import {
  Fingerprint,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  X,
  FileKey,
  Smartphone,
  ArrowLeft,
  ChevronRight,
  Send,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { startAuthentication } from '@simplewebauthn/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSudoStore } from '@/stores/sudoStore'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/features/auth/api/authApi'
import { GoogleIcon, GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton'
import { GitHubIcon } from '@/features/auth/components/GitHubSignInButton'
import type { SudoVerifyRequest } from '@/types/api'

type SudoView = 'passkey' | 'methods' | 'password' | 'google' | 'github' | 'sms' | 'recovery'
type MfaFactorChoice = 'totp' | 'sms' | 'recovery'

export function SudoModal() {
  const { isOpen, resolveElevation, cancelElevation } = useSudoStore()
  const { user } = useAuthStore()

  /* Available factor flags from user profile */
  const hasPasskey = Boolean(user?.passkey_enabled)
  const hasPassword = Boolean(user?.has_password)
  const hasSocial = Boolean(user?.has_social_accounts)
  const hasTotp = Boolean(user?.mfa_enabled)
  const hasSms = Boolean(user?.sms_mfa_enabled)
  const hasMfa = hasTotp || hasSms

  /* Track which specific social providers are linked (Google, GitHub) */
  const [linkedProviders, setLinkedProviders] = useState<{ google: boolean; github: boolean }>({
    google: true,
    github: true,
  })

  /* Determine default MFA choice (prefer TOTP if enabled, else SMS, else recovery) */
  const getDefaultMfaChoice = useCallback((): MfaFactorChoice => {
    if (hasTotp) return 'totp'
    if (hasSms) return 'sms'
    return 'recovery'
  }, [hasTotp, hasSms])

  const [mfaChoice, setMfaChoice] = useState<MfaFactorChoice>(getDefaultMfaChoice())

  /* Determine initial default view */
  const getInitialView = useCallback((): SudoView => {
    if (hasPasskey) return 'passkey'
    if (hasPassword) return 'password'
    if (linkedProviders.google) return 'google'
    if (linkedProviders.github) return 'github'
    return 'methods'
  }, [hasPasskey, hasPassword, linkedProviders])

  const [view, setView] = useState<SudoView>('methods')

  /* Form states */
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  /* Google OAuth State */
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null)

  /* GitHub OAuth State */
  const [githubCode, setGithubCode] = useState<string | null>(null)
  const [githubRedirectUri, setGithubRedirectUri] = useState<string | null>(null)
  const [githubPopupWaiting, setGithubPopupWaiting] = useState(false)

  /* SMS Cooldown State */
  const [smsCooldown, setSmsCooldown] = useState(0)
  const [smsSent, setSmsSent] = useState(false)

  /* Async UI states */
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Load linked social providers when modal opens */
  useEffect(() => {
    if (isOpen && hasSocial) {
      authApi
        .getSocialAccounts()
        .then((res) => {
          if (res.success && res.data) {
            const hasG = res.data.some((a) => a.provider === 'GOOGLE')
            const hasGh = res.data.some((a) => a.provider === 'GITHUB')
            setLinkedProviders({ google: hasG, github: hasGh })
          }
        })
        .catch((err) => {
          console.warn('Failed to load linked social accounts for sudo:', err)
        })
    }
  }, [isOpen, hasSocial])

  /* Reset modal state on open */
  useEffect(() => {
    if (isOpen) {
      const initial = getInitialView()
      setView(initial)
      setMfaChoice(getDefaultMfaChoice())
      setPassword('')
      setShowPassword(false)
      setTotpCode('')
      setSmsCode('')
      setRecoveryCode('')
      setGoogleIdToken(null)
      setGithubCode(null)
      setGithubRedirectUri(null)
      setGithubPopupWaiting(false)
      setError(null)
      setLoading(false)
      setSmsCooldown(0)
      setSmsSent(false)
    }
  }, [isOpen, hasPasskey, hasPassword, getInitialView, getDefaultMfaChoice])

  /* SMS Cooldown timer */
  useEffect(() => {
    if (smsCooldown <= 0) return
    const timer = setInterval(() => {
      setSmsCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [smsCooldown])

  /* 1. Passkey Elevation Handler */
  const handlePasskeyElevation = async () => {
    setError(null)
    setLoading(true)

    try {
      const options = await authApi.getSudoPasskeyOptions()
      const assertion = await startAuthentication({ optionsJSON: options })
      const res = await authApi.verifySudoPasskey(assertion)

      if (res.success) {
        toast.success('Security context elevated with passkey')
        resolveElevation()
      } else {
        throw new Error(res.message || 'Passkey verification failed')
      }
    } catch (err: any) {
      console.error('Passkey sudo elevation error:', err)
      const msg = err.name === 'NotAllowedError'
        ? 'Passkey prompt was cancelled or timed out.'
        : err?.response?.data?.message || err?.message || 'Failed to verify passkey. Please try again or choose another method.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* 2. Dispatch SMS OTP */
  const handleSendSms = async () => {
    if (smsCooldown > 0) return
    setError(null)
    setLoading(true)

    try {
      await authApi.sendSudoSmsOtp()
      setSmsSent(true)
      setSmsCooldown(60)
      toast.success('Verification SMS code sent to your phone')
    } catch (err: any) {
      console.error('Failed to dispatch SMS OTP:', err)
      const msg = err?.response?.data?.message || err?.message || 'Failed to send SMS code. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* 3. Password Verification Handler */
  const handlePasswordElevation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      const msg = 'Please enter your account password.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (hasMfa) {
      if (mfaChoice === 'totp' && totpCode.trim().length < 6) {
        const msg = 'Please enter the 6-digit authenticator code.'
        setError(msg)
        toast.error(msg)
        return
      }
      if (mfaChoice === 'sms' && smsCode.trim().length < 6) {
        const msg = 'Please enter the 6-digit SMS verification code.'
        setError(msg)
        toast.error(msg)
        return
      }
      if (mfaChoice === 'recovery' && !recoveryCode.trim()) {
        const msg = 'Please enter an emergency recovery code.'
        setError(msg)
        toast.error(msg)
        return
      }
    }

    setError(null)
    setLoading(true)

    try {
      const payload: SudoVerifyRequest = {
        password: password.trim(),
        totp_code: hasMfa && mfaChoice === 'totp' ? totpCode.trim() : undefined,
        sms_code: hasMfa && mfaChoice === 'sms' ? smsCode.trim() : undefined,
        recovery_code: hasMfa && mfaChoice === 'recovery' ? recoveryCode.trim() : undefined,
      }

      const res = await authApi.verifySudo(payload)
      if (res.success) {
        toast.success('Security context elevated')
        resolveElevation()
      } else {
        throw new Error(res.message || 'Verification failed')
      }
    } catch (err: any) {
      console.error('Password sudo elevation error:', err)
      const msg = err?.response?.data?.message || err?.message || 'Invalid password or verification code.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* 4. Google Elevation Handlers */
  const submitGoogleElevation = async (
    idToken: string,
    totp?: string,
    sms?: string,
    recovery?: string
  ) => {
    setError(null)
    setLoading(true)

    try {
      const payload: SudoVerifyRequest = {
        google_id_token: idToken,
        totp_code: totp || undefined,
        sms_code: sms || undefined,
        recovery_code: recovery || undefined,
      }

      const res = await authApi.verifySudo(payload)
      if (res.success) {
        toast.success('Security context elevated with Google')
        resolveElevation()
      } else {
        throw new Error(res.message || 'Google verification failed')
      }
    } catch (err: any) {
      console.error('Google sudo elevation error:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to verify with Google. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (idToken: string) => {
    setError(null)
    if (hasMfa) {
      setGoogleIdToken(idToken)
      setView('google')
      toast.info('Google verified. Complete your second factor.')
    } else {
      await submitGoogleElevation(idToken)
    }
  }

  const handleGoogleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!googleIdToken) {
      const msg = 'Please verify with Google first.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (mfaChoice === 'totp' && totpCode.trim().length < 6) {
      const msg = 'Please enter the 6-digit authenticator code.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (mfaChoice === 'sms' && smsCode.trim().length < 6) {
      const msg = 'Please enter the 6-digit SMS verification code.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (mfaChoice === 'recovery' && !recoveryCode.trim()) {
      const msg = 'Please enter an emergency recovery code.'
      setError(msg)
      toast.error(msg)
      return
    }

    await submitGoogleElevation(
      googleIdToken,
      mfaChoice === 'totp' ? totpCode.trim() : undefined,
      mfaChoice === 'sms' ? smsCode.trim() : undefined,
      mfaChoice === 'recovery' ? recoveryCode.trim() : undefined
    )
  }

  /* 5. GitHub Elevation Handlers */
  const submitGitHubElevation = useCallback(
    async (
      code: string,
      redirectUri: string,
      totp?: string,
      sms?: string,
      recovery?: string
    ) => {
      setError(null)
      setLoading(true)

      try {
        const payload: SudoVerifyRequest = {
          github_code: code,
          github_redirect_uri: redirectUri,
          totp_code: totp || undefined,
          sms_code: sms || undefined,
          recovery_code: recovery || undefined,
        }

        const res = await authApi.verifySudo(payload)
        if (res.success) {
          toast.success('Security context elevated with GitHub')
          resolveElevation()
        } else {
          throw new Error(res.message || 'GitHub verification failed')
        }
      } catch (err: any) {
        console.error('GitHub sudo elevation error:', err)
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to verify with GitHub. Please ensure you are logged into your linked account.'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
        setGithubPopupWaiting(false)
      }
    },
    [resolveElevation]
  )

  const handleStartGitHubOAuth = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId || clientId === 'your_github_client_id_here' || clientId.trim() === '') {
      const msg = 'GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID.'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    setGithubPopupWaiting(true)

    const state = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    sessionStorage.setItem('vaultix_github_oauth_state', state)
    sessionStorage.setItem('vaultix_github_oauth_action', 'sudo')

    const redirectUri = `${window.location.origin}/oauth/callback/github`
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&scope=read:user%20user:email&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(state)}`

    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const popup = window.open(
      githubUrl,
      'vaultix_github_sudo',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    )

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setGithubPopupWaiting(false)
      const msg = 'Popup was blocked by your browser. Please allow popups for this site to verify with GitHub.'
      setError(msg)
      toast.error(msg)
    }
  }

  /* Listen for GitHub OAuth popup message */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'VAULTIX_GITHUB_SUDO_CALLBACK') {
        const { code, state, error: ghError } = event.data
        setGithubPopupWaiting(false)

        const storedState = sessionStorage.getItem('vaultix_github_oauth_state')
        sessionStorage.removeItem('vaultix_github_oauth_state')
        sessionStorage.removeItem('vaultix_github_oauth_action')

        if (ghError) {
          const msg = `GitHub verification was cancelled: ${ghError}`
          setError(msg)
          toast.error(msg)
          return
        }

        if (!code || state !== storedState) {
          const msg = 'Invalid OAuth state from GitHub callback.'
          setError(msg)
          toast.error(msg)
          return
        }

        const redirectUri = `${window.location.origin}/oauth/callback/github`
        if (hasMfa) {
          setGithubCode(code)
          setGithubRedirectUri(redirectUri)
          setView('github')
          toast.info('GitHub verified. Complete your second factor.')
        } else {
          submitGitHubElevation(code, redirectUri)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [hasMfa, submitGitHubElevation])

  const handleGitHubMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubCode || !githubRedirectUri) {
      const msg = 'Please verify with GitHub first.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (mfaChoice === 'totp' && totpCode.trim().length < 6) {
      const msg = 'Please enter the 6-digit authenticator code.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (mfaChoice === 'sms' && smsCode.trim().length < 6) {
      const msg = 'Please enter the 6-digit SMS verification code.'
      setError(msg)
      toast.error(msg)
      return
    }
    if (mfaChoice === 'recovery' && !recoveryCode.trim()) {
      const msg = 'Please enter an emergency recovery code.'
      setError(msg)
      toast.error(msg)
      return
    }

    await submitGitHubElevation(
      githubCode,
      githubRedirectUri,
      mfaChoice === 'totp' ? totpCode.trim() : undefined,
      mfaChoice === 'sms' ? smsCode.trim() : undefined,
      mfaChoice === 'recovery' ? recoveryCode.trim() : undefined
    )
  }

  /* 6. Dedicated SMS Elevation Handler */
  const handleSmsElevation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasPassword && !password.trim()) {
      const msg = 'Please enter your account password.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (smsCode.trim().length < 6) {
      const msg = 'Please enter the 6-digit SMS verification code.'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const payload: SudoVerifyRequest = {
        password: hasPassword ? password.trim() : undefined,
        sms_code: smsCode.trim(),
      }

      const res = await authApi.verifySudo(payload)
      if (res.success) {
        toast.success('Security context elevated with SMS')
        resolveElevation()
      } else {
        throw new Error(res.message || 'SMS verification failed')
      }
    } catch (err: any) {
      console.error('SMS sudo elevation error:', err)
      const msg = err?.response?.data?.message || err?.message || 'Invalid SMS verification code.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* 7. Emergency Recovery Code Elevation Handler */
  const handleRecoveryElevation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasPassword && !password.trim()) {
      const msg = 'Please enter your account password.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!recoveryCode.trim()) {
      const msg = 'Please enter an emergency recovery code.'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    setLoading(true)

    try {
      const payload: SudoVerifyRequest = {
        password: hasPassword ? password.trim() : undefined,
        recovery_code: recoveryCode.trim(),
      }

      const res = await authApi.verifySudo(payload)
      if (res.success) {
        toast.success('Security context elevated with recovery code')
        resolveElevation()
      } else {
        throw new Error(res.message || 'Recovery code verification failed')
      }
    } catch (err: any) {
      console.error('Recovery code sudo elevation error:', err)
      const msg = err?.response?.data?.message || err?.message || 'Invalid or already used recovery code.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      cancelElevation()
    }
  }

  if (!isOpen) return null

  const initialView = getInitialView()

  /* Helper to render secondary MFA inputs (TOTP, SMS, Recovery) with seamless switching */
  const renderMfaInputs = () => {
    if (!hasMfa) return null

    return (
      <div className="space-y-3.5 pt-1">
        {mfaChoice === 'totp' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span>Authenticator Code (TOTP)</span>
              </label>
              <span className="text-xs text-zinc-400 font-medium">6 digits</span>
            </div>
            <Input
              type="text"
              placeholder="000 000"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, ''))
                if (error) setError(null)
              }}
              disabled={loading}
              autoFocus
              className="h-12 text-lg sm:text-xl font-mono tracking-widest rounded-xl text-center border-zinc-300 dark:border-zinc-700/80 font-bold"
            />
          </div>
        )}

        {mfaChoice === 'sms' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                <span>SMS Verification Code</span>
              </label>
              <button
                type="button"
                onClick={handleSendSms}
                disabled={loading || smsCooldown > 0}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {smsCooldown > 0 ? `Resend in ${smsCooldown}s` : smsSent ? 'Resend Code' : 'Send Code'}
              </button>
            </div>
            <Input
              type="text"
              placeholder="000 000"
              maxLength={6}
              value={smsCode}
              onChange={(e) => {
                setSmsCode(e.target.value.replace(/\D/g, ''))
                if (error) setError(null)
              }}
              disabled={loading}
              autoFocus
              className="h-12 text-lg sm:text-xl font-mono tracking-widest rounded-xl text-center border-zinc-300 dark:border-zinc-700/80 font-bold"
            />
          </div>
        )}

        {mfaChoice === 'recovery' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <FileKey className="h-4 w-4 text-amber-500" />
                <span>Emergency Recovery Code</span>
              </label>
              <span className="text-xs text-zinc-400 font-medium">10 characters</span>
            </div>
            <Input
              type="text"
              placeholder="XXXXX-XXXXX"
              value={recoveryCode}
              onChange={(e) => {
                setRecoveryCode(e.target.value)
                if (error) setError(null)
              }}
              disabled={loading}
              autoFocus
              className="h-12 text-base sm:text-lg font-mono tracking-wider rounded-xl text-center uppercase border-zinc-300 dark:border-zinc-700/80 font-bold"
            />
          </div>
        )}

        {/* Dynamic switcher row allowing user to use ANY of their enabled MFA factors */}
        <div className="flex items-center justify-between pt-1 text-xs font-semibold">
          {mfaChoice === 'totp' && (
            <>
              {hasSms ? (
                <button
                  type="button"
                  onClick={() => {
                    setMfaChoice('sms')
                    setError(null)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Get code via SMS instead
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => {
                  setMfaChoice('recovery')
                  setError(null)
                }}
                className="text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 underline cursor-pointer"
              >
                Use recovery code
              </button>
            </>
          )}

          {mfaChoice === 'sms' && (
            <>
              {hasTotp ? (
                <button
                  type="button"
                  onClick={() => {
                    setMfaChoice('totp')
                    setError(null)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Use authenticator app instead
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => {
                  setMfaChoice('recovery')
                  setError(null)
                }}
                className="text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 underline cursor-pointer"
              >
                Use recovery code
              </button>
            </>
          )}

          {mfaChoice === 'recovery' && (
            <div className="flex items-center gap-4">
              {hasTotp && (
                <button
                  type="button"
                  onClick={() => {
                    setMfaChoice('totp')
                    setError(null)
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Use authenticator app
                </button>
              )}
              {hasSms && (
                <button
                  type="button"
                  onClick={() => {
                    setMfaChoice('sms')
                    setError(null)
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Get code via SMS
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg sm:max-w-xl p-7 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50 p-1"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Top Bar (Back button if not in root view) */}
        {view !== initialView && (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setGoogleIdToken(null)
              setGithubCode(null)
              setGithubRedirectUri(null)
              setGithubPopupWaiting(false)
              if (view === 'methods') {
                setView(initialView)
              } else {
                setView('methods')
              }
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer -ml-1 -mt-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <Lock className="h-6 w-6 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-white">
                Verify it's you
              </h2>
              <span className="text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Sudo Mode
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed font-medium">
              {view === 'methods'
                ? 'Choose another way to confirm your identity.'
                : 'To protect your account, please confirm it’s you before continuing.'}
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* ---------------- VIEW 1: PASSKEY (GOOGLE / APPLE STYLE DEFAULT) ---------------- */}
        {view === 'passkey' && (
          <div className="space-y-4 pt-1">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                <Fingerprint className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Use your passkey
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                  Confirm your identity using Windows Hello, Touch ID, Face ID, or a hardware security key.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePasskeyElevation}
              disabled={loading}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Prompting Authenticator...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5" />
                  <span>Continue with Passkey</span>
                </>
              )}
            </Button>

            {/* Try Another Way Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setView('methods')
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Try another way
              </button>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 2: TRY ANOTHER WAY (METHODS LIST) ---------------- */}
        {view === 'methods' && (
          <div className="space-y-2.5 pt-1">
            {hasPasskey && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setView('passkey')
                }}
                className="w-full p-4 sm:p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Fingerprint className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      Use your passkey
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Biometric sensor or security key
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {hasSocial && linkedProviders.google && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setGoogleIdToken(null)
                  setView('google')
                }}
                className="w-full p-4 sm:p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <GoogleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      Verify with Google
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {hasMfa ? 'Google account + two-factor verification' : 'Instant elevation via your linked Google account'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {hasSocial && linkedProviders.github && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setGithubCode(null)
                  setGithubRedirectUri(null)
                  setView('github')
                }}
                className="w-full p-4 sm:p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <GitHubIcon className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      Verify with GitHub
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {hasMfa ? 'GitHub account + two-factor verification' : 'Instant elevation via your linked GitHub account'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {hasPassword && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setView('password')
                }}
                className="w-full p-4 sm:p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      Enter your password
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {hasMfa ? 'Account password + 2FA code' : 'Your standard account password'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {hasSms && hasPassword && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMfaChoice('sms')
                  setView('sms')
                }}
                className="w-full p-4 sm:p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      Get a code via SMS
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Text message to your registered phone
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {hasMfa && hasPassword && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setMfaChoice('recovery')
                  setView('recovery')
                }}
                className="w-full p-4 sm:p-4.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center justify-between text-left transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileKey className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      Use an emergency recovery code
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Single-use backup code
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

            {!hasPasskey && !hasSocial && !hasPassword && (
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500 font-medium">
                No elevation authentication methods found on your profile. Please contact support.
              </div>
            )}
          </div>
        )}

        {/* ---------------- VIEW 3: VERIFY WITH GOOGLE ---------------- */}
        {view === 'google' && (
          <div className="space-y-4 pt-1">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xs flex items-center justify-center">
                <GoogleIcon className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-zinc-950 dark:text-white">
                  Verify with Google
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                  {googleIdToken
                    ? 'Google identity confirmed! Enter your two-factor authentication code below.'
                    : 'Confirm your identity using your linked Google account.'}
                </p>
              </div>
            </div>

            {!googleIdToken ? (
              <div className="space-y-3">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => {
                    setError(err)
                    toast.error(err)
                  }}
                  text="continue_with"
                  label="Verify with Google"
                  isLoading={loading}
                  disabled={loading}
                  size="lg"
                />
                {hasMfa && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    You will be prompted for your secondary verification code after Google sign-in.
                  </p>
                )}
              </div>
            ) : (
              /* If Google is verified and user requires secondary MFA factor */
              <form onSubmit={handleGoogleMfaSubmit} className="space-y-4">
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Google identity verified. Complete secondary factor:</span>
                </div>

                {renderMfaInputs()}

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (mfaChoice === 'totp' && totpCode.length < 6) ||
                    (mfaChoice === 'sms' && smsCode.length < 6) ||
                    (mfaChoice === 'recovery' && !recoveryCode.trim())
                  }
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                      <span>Completing Elevation...</span>
                    </>
                  ) : (
                    <span>Complete Elevation</span>
                  )}
                </Button>
              </form>
            )}

            {/* Try Another Way Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setGoogleIdToken(null)
                  setView('methods')
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Try another way
              </button>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 4: VERIFY WITH GITHUB ---------------- */}
        {view === 'github' && (
          <div className="space-y-4 pt-1">
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs flex items-center justify-center">
                <GitHubIcon className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-zinc-950 dark:text-white">
                  Verify with GitHub
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium">
                  {githubCode
                    ? 'GitHub identity confirmed! Enter your two-factor authentication code below.'
                    : 'Confirm your identity using your linked GitHub account.'}
                </p>
              </div>
            </div>

            {!githubCode ? (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartGitHubOAuth}
                  disabled={loading || githubPopupWaiting}
                  className="w-full h-11 sm:h-12 font-semibold text-sm sm:text-base rounded-xl border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-all active:scale-[0.99]"
                >
                  {githubPopupWaiting || loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                      <span>Waiting for GitHub authorization...</span>
                    </>
                  ) : (
                    <>
                      <GitHubIcon className="h-5 w-5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                      <span>Verify with GitHub</span>
                    </>
                  )}
                </Button>
                {hasMfa && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed font-medium">
                    You will be prompted for your secondary verification code after GitHub sign-in.
                  </p>
                )}
              </div>
            ) : (
              /* If GitHub is verified and user requires secondary MFA factor */
              <form onSubmit={handleGitHubMfaSubmit} className="space-y-4">
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>GitHub identity verified. Complete secondary factor:</span>
                </div>

                {renderMfaInputs()}

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (mfaChoice === 'totp' && totpCode.length < 6) ||
                    (mfaChoice === 'sms' && smsCode.length < 6) ||
                    (mfaChoice === 'recovery' && !recoveryCode.trim())
                  }
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                      <span>Completing Elevation...</span>
                    </>
                  ) : (
                    <span>Complete Elevation</span>
                  )}
                </Button>
              </form>
            )}

            {/* Try Another Way Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setGithubCode(null)
                  setGithubRedirectUri(null)
                  setView('methods')
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Try another way
              </button>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 5: PASSWORD & MFA ---------------- */}
        {view === 'password' && (
          <form onSubmit={handlePasswordElevation} className="space-y-4.5 pt-1">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Account Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  disabled={loading}
                  autoFocus
                  className="h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl border-zinc-300 dark:border-zinc-700/80 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* If user has MFA enabled, render secondary factor inputs */}
            {renderMfaInputs()}

            <Button
              type="submit"
              disabled={
                loading ||
                !password.trim() ||
                (hasMfa &&
                  ((mfaChoice === 'totp' && totpCode.length < 6) ||
                    (mfaChoice === 'sms' && smsCode.length < 6) ||
                    (mfaChoice === 'recovery' && !recoveryCode.trim())))
              }
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Confirm &amp; Elevate</span>
              )}
            </Button>

            {/* Try Another Way Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setView('methods')
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Try another way
              </button>
            </div>
          </form>
        )}

        {/* ---------------- VIEW 6: DEDICATED SMS MFA ---------------- */}
        {view === 'sms' && (
          <form onSubmit={handleSmsElevation} className="space-y-4.5 pt-1">
            <div className="p-4.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950 dark:text-white">
                    SMS Two-Factor Authentication
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    We will send a 6-digit verification code to your phone.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendSms}
                  disabled={loading || smsCooldown > 0}
                  className="w-full h-9 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer border-zinc-300 dark:border-zinc-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {smsCooldown > 0
                      ? `Code Sent (Resend in ${smsCooldown}s)`
                      : smsSent
                      ? 'Resend SMS Code'
                      : 'Send Verification Code'}
                  </span>
                </Button>
              </div>
            </div>

            {hasPassword && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Account Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError(null)
                    }}
                    disabled={loading}
                    className="h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl border-zinc-300 dark:border-zinc-700/80 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                6-digit SMS Code
              </label>
              <Input
                type="text"
                placeholder="000 000"
                maxLength={6}
                value={smsCode}
                onChange={(e) => {
                  setSmsCode(e.target.value.replace(/\D/g, ''))
                  if (error) setError(null)
                }}
                disabled={loading}
                autoFocus
                className="h-12 text-lg sm:text-xl font-mono tracking-widest rounded-xl text-center border-zinc-300 dark:border-zinc-700/80 font-bold"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || (hasPassword && !password.trim()) || smsCode.length < 6}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify SMS &amp; Elevate</span>
              )}
            </Button>

            {/* Try Another Way Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setView('methods')
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Try another way
              </button>
            </div>
          </form>
        )}

        {/* ---------------- VIEW 7: EMERGENCY RECOVERY CODE ---------------- */}
        {view === 'recovery' && (
          <form onSubmit={handleRecoveryElevation} className="space-y-4.5 pt-1">
            {hasPassword && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Account Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError(null)
                    }}
                    disabled={loading}
                    className="h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl border-zinc-300 dark:border-zinc-700/80 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Emergency Recovery Code
              </label>
              <Input
                type="text"
                placeholder="XXXXX-XXXXX"
                value={recoveryCode}
                onChange={(e) => {
                  setRecoveryCode(e.target.value)
                  if (error) setError(null)
                }}
                disabled={loading}
                autoFocus
                className="h-12 text-base sm:text-lg font-mono tracking-wider rounded-xl text-center uppercase border-zinc-300 dark:border-zinc-700/80 font-bold"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Enter one of your 10-character backup recovery codes.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || (hasPassword && !password.trim()) || !recoveryCode.trim()}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Use Recovery Code</span>
              )}
            </Button>

            {/* Try Another Way Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setView('methods')
                }}
                disabled={loading}
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Try another way
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
