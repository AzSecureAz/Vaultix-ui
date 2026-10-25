import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Smartphone,
  ShieldAlert,
  ArrowLeft,
  Shield,
  AlertCircle,
  Fingerprint,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { authApi } from '../api/authApi'
import { GoogleSignInButton } from './GoogleSignInButton'

type MfaFactor = 'totp' | 'recovery' | 'sms'

export function LoginForm() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated, isInitializing } = useAuthStore()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<{
    mfaToken: string
    hasRecoveryCodes?: boolean
    totpEnabled?: boolean
    smsMfaEnabled?: boolean
    maskedPhoneNumber?: string
  } | null>(null)

  const [mfaMethod, setMfaMethod] = useState<MfaFactor>('totp')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [smsSent, setSmsSent] = useState(false)

  // Countdown timer for login SMS OTP resend
  useEffect(() => {
    if (smsCountdown <= 0) return
    const timer = setInterval(() => {
      setSmsCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [smsCountdown])

  const handleSendLoginSmsOtp = async () => {
    if (!mfaChallenge?.mfaToken || smsSending || smsCountdown > 0) return
    setError(null)
    setSmsSending(true)
    try {
      await authApi.sendLoginSmsOtp(mfaChallenge.mfaToken)
      setSmsSent(true)
      setSmsCountdown(60)
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Failed to send SMS verification code. Please try again.')
    } finally {
      setSmsSending(false)
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isInitializing, navigate])

  const handlePasskeyLogin = async () => {
    setError(null)
    setFieldErrors({})

    if (!browserSupportsWebAuthn()) {
      setError('Passkeys are not supported by this browser.')
      return
    }

    setPasskeyLoading(true)

    try {
      const options = await authApi.getPasskeyAuthOptions()
      const assertion = await startAuthentication({ optionsJSON: options })
      const response = await authApi.loginWithPasskey(assertion)

      if (response.success && response.data) {
        await setAuth(response.data)
        navigate('/dashboard')
      } else {
        setError(response.message || 'Passkey authentication failed.')
      }
    } catch (err: any) {
      console.error('Passkey authentication error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Passkey prompt was cancelled.')
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to sign in with passkey.'
        setError(msg)
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  const handleGoogleLogin = async (idToken: string) => {
    setError(null)
    setFieldErrors({})
    setGoogleLoading(true)

    try {
      const response = await authApi.loginWithGoogle(idToken)

      if (response.success && response.data) {
        if (response.data.mfa_required && response.data.mfa_token) {
          setMfaChallenge({
            mfaToken: response.data.mfa_token,
            hasRecoveryCodes: response.data.has_recovery_codes,
            totpEnabled: response.data.totp_enabled,
            smsMfaEnabled: response.data.sms_mfa_enabled,
            maskedPhoneNumber: response.data.masked_phone_number,
          })
          if (response.data.totp_enabled !== false) {
            setMfaMethod('totp')
          } else if (response.data.sms_mfa_enabled) {
            setMfaMethod('sms')
          } else {
            setMfaMethod('recovery')
          }
          setMfaCode('')
          setSmsSent(false)
          setSmsCountdown(0)
        } else {
          await setAuth(response.data)
          navigate('/dashboard')
        }
      } else {
        setError(response.message || 'Google authentication failed.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      setError(
        errData?.message ||
          errData?.error ||
          'Failed to authenticate with Google.'
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const response = await authApi.login({
        identifier: usernameOrEmail.trim(),
        password,
      })

      if (response.success && response.data) {
        if (response.data.mfa_required && response.data.mfa_token) {
          setMfaChallenge({
            mfaToken: response.data.mfa_token,
            hasRecoveryCodes: response.data.has_recovery_codes,
            totpEnabled: response.data.totp_enabled,
            smsMfaEnabled: response.data.sms_mfa_enabled,
            maskedPhoneNumber: response.data.masked_phone_number,
          })
          if (response.data.totp_enabled !== false) {
            setMfaMethod('totp')
          } else if (response.data.sms_mfa_enabled) {
            setMfaMethod('sms')
          } else {
            setMfaMethod('recovery')
          }
          setMfaCode('')
          setSmsSent(false)
          setSmsCountdown(0)
        } else {
          await setAuth(response.data)
          navigate('/dashboard')
        }
      } else {
        setError(response.message || 'Authentication failed. Please verify your credentials.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object' && Object.keys(errData.errors).length > 0) {
        setFieldErrors(errData.errors)
        // Show global error only if there are errors that do not map to our inputs
        const unhandled = Object.entries(errData.errors).filter(
          ([key]) => key !== 'identifier' && key !== 'password' && key !== 'username' && key !== 'email'
        )
        if (unhandled.length > 0) {
          setError(unhandled.map(([, val]) => val).join('. '))
        }
      } else {
        setError(
          errData?.message ||
            errData?.error ||
            'Invalid username or password'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaChallenge) return
    setError(null)
    setMfaLoading(true)

    try {
      const response = await authApi.verifyMfa({
        mfa_token: mfaChallenge.mfaToken,
        code: mfaCode.trim(),
        factor: mfaMethod,
      })

      if (response.success && response.data) {
        await setAuth(response.data)
        navigate('/dashboard')
      } else {
        setError(response.message || 'MFA verification failed')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Invalid verification code')
    } finally {
      setMfaLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] bg-grid-pattern text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pt-2">
        <Logo size="sm" subtitle="IAM" />
        <ThemeToggle variant="segmented" />
      </header>

      {/* Clerk-Style Center Auth Card */}
      <main className="my-auto w-full max-w-[400px] mx-auto py-6">
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-zinc-950/5 dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-all">
          {/* Card Header with Centered Emblem */}
          <div className="p-7 pb-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {mfaChallenge ? 'Two-step verification' : 'Sign in to Vaultix'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {mfaChallenge
                ? 'Confirm your identity using an authorized factor'
                : 'Welcome back! Please enter your details.'}
            </p>
          </div>

          {/* Card Body */}
          <div className="px-7 pb-7">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!mfaChallenge ? (
              <div className="space-y-3">
                {/* Google Sign In */}
                <GoogleSignInButton
                  onSuccess={handleGoogleLogin}
                  onError={(msg) => setError(msg)}
                  disabled={googleLoading || passkeyLoading || loading}
                  isLoading={googleLoading}
                  text="continue_with"
                />

                {/* Sign in with Passkey Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading || googleLoading || loading}
                  className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {passkeyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  ) : (
                    <Fingerprint className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  )}
                  <span>{passkeyLoading ? 'Verifying with passkey...' : 'Sign in with a passkey'}</span>
                </Button>

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 text-[10px] font-medium tracking-wider">
                      or continue with password
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Username or email
                    </label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter your username or email"
                    value={usernameOrEmail}
                    onChange={(e) => {
                      setUsernameOrEmail(e.target.value)
                      if (fieldErrors.identifier || fieldErrors.username || fieldErrors.email) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.identifier
                          delete next.username
                          delete next.email
                          return next
                        })
                      }
                    }}
                    autoComplete="username"
                    autoFocus
                    className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                      fieldErrors.identifier || fieldErrors.username || fieldErrors.email
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  {(fieldErrors.identifier || fieldErrors.username || fieldErrors.email) && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.identifier || fieldErrors.username || fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => {
                            const next = { ...prev }
                            delete next.password
                            return next
                          })
                        }
                      }}
                      autoComplete="current-password"
                      className={`h-10 pr-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                        fieldErrors.password
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <span>Continue</span>
                  )}
                </Button>
              </form>
            </div>
          ) : (
              <div className="space-y-4">
                {/* Method Switcher Tabs */}
                <div className={`grid ${mfaChallenge?.smsMfaEnabled && mfaChallenge?.totpEnabled !== false ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs`}>
                  {mfaChallenge?.totpEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        setMfaMethod('totp')
                        setMfaCode('')
                        setError(null)
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                        mfaMethod === 'totp'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>App</span>
                    </button>
                  )}

                  {mfaChallenge?.smsMfaEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setMfaMethod('sms')
                        setMfaCode('')
                        setError(null)
                        if (!smsSent && smsCountdown === 0) {
                          handleSendLoginSmsOtp()
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                        mfaMethod === 'sms'
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>SMS</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMfaMethod('recovery')
                      setMfaCode('')
                      setError(null)
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
                      mfaMethod === 'recovery'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Recovery</span>
                  </button>
                </div>

                {/* Factor Form Bodies */}
                {mfaMethod === 'totp' && (
                  <form onSubmit={handleMfaSubmit} className="space-y-4">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-200">
                        <KeyRound className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Authenticator App</span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                        Enter the 6-digit TOTP code from Google Authenticator, 1Password, or Authy.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Verification Code
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="000 000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.trim())}
                        autoFocus
                        maxLength={8}
                        className="text-center tracking-widest font-mono text-base h-11 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMfaChallenge(null)
                          setMfaCode('')
                        }}
                        className="w-1/3 text-xs h-10 rounded-lg"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={mfaLoading || !mfaCode}
                        className="flex-1 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                      >
                        {mfaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>Verify Code</span>
                      </Button>
                    </div>
                  </form>
                )}

                {mfaMethod === 'sms' && (
                  <form onSubmit={handleMfaSubmit} className="space-y-4">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-200">
                          <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                          <span>SMS Text Message</span>
                        </div>
                        {smsCountdown > 0 ? (
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Resend in {smsCountdown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendLoginSmsOtp}
                            disabled={smsSending}
                            className="text-[11px] text-zinc-900 dark:text-zinc-100 hover:underline font-medium cursor-pointer"
                          >
                            {smsSending ? 'Sending...' : smsSent ? 'Resend code' : 'Send code'}
                          </button>
                        )}
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                        {smsSent
                          ? `A 6-digit verification code has been sent to your phone ${mfaChallenge.maskedPhoneNumber ? `(${mfaChallenge.maskedPhoneNumber})` : ''}.`
                          : `Click above to send a verification code to your phone ${mfaChallenge.maskedPhoneNumber ? `(${mfaChallenge.maskedPhoneNumber})` : ''}.`}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Verification Code
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="000 000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                        maxLength={6}
                        className="text-center tracking-widest font-mono text-base h-11 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMfaChallenge(null)
                          setMfaCode('')
                        }}
                        className="w-1/3 text-xs h-10 rounded-lg cursor-pointer"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={mfaLoading || mfaCode.length < 6}
                        className="flex-1 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 cursor-pointer"
                      >
                        {mfaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>Verify SMS Code</span>
                      </Button>
                    </div>
                  </form>
                )}

                {mfaMethod === 'recovery' && (
                  <form onSubmit={handleMfaSubmit} className="space-y-4">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-200">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        <span>Emergency Recovery Code</span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                        Enter one of your emergency recovery codes. Each code can only be used once.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Recovery Code
                      </label>
                      <Input
                        type="text"
                        required
                        placeholder="xxxxx-xxxxx"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.trim())}
                        autoFocus
                        className="font-mono text-center text-sm h-11 uppercase tracking-wider rounded-lg"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMfaChallenge(null)
                          setMfaCode('')
                        }}
                        className="w-1/3 text-xs h-10 rounded-lg"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" /> Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={mfaLoading || !mfaCode}
                        className="flex-1 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                      >
                        {mfaLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        <span>Redeem Code</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Clerk Signature Card Footer */}
          {!mfaChallenge && (
            <div className="px-7 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Clerk Signature "Secured by" Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
          <Shield className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
          <span>Secured by Vaultix IAM</span>
        </div>
      </main>

      {/* Screen Bottom Footer */}
      <footer className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 pb-2 gap-3">
        <p>&copy; {new Date().getFullYear()} Vaultix, Inc.</p>
        <div className="flex items-center gap-5">
          <a href="#terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Terms</a>
          <a href="#privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#security" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  )
}
