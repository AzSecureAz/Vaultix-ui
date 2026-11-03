import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  KeyRound,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  Shield,
  AlertCircle,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '../api/authApi'
import { LegalModal, type LegalModalType } from '@/components/ui/LegalModal'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialIdentifier = searchParams.get('identifier') || searchParams.get('email') || ''
  const [step, setStep] = useState<'request' | 'confirm' | 'success'>('request')
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [legalModalType, setLegalModalType] = useState<LegalModalType>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  // Password requirements helper
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasDigit = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0

  const isPasswordValid =
    hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await authApi.requestPasswordReset({
        identifier: identifier.trim(),
      })
      const msg = res.message || 'If an account exists, a 6-digit recovery code has been sent to your email.'
      setInfoMsg(msg)
      toast.success('Recovery code dispatched to your registered email')
      setStep('confirm')
    } catch (err: any) {
      const errData = err?.response?.data
      const msg = errData?.errors ? Object.values(errData.errors).join('. ') : errData?.message || 'Unable to process password reset request.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      const msg = 'Please satisfy all password complexity requirements.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!passwordsMatch) {
      const msg = 'Passwords do not match.'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)

    try {
      const res = await authApi.confirmPasswordReset({
        identifier: identifier.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      })
      if (res.success) {
        setStep('success')
        toast.success('Password updated successfully!')
      } else {
        const msg = res.message || 'Password reset confirmation failed.'
        setError(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      const errData = err?.response?.data
      const msg = errData?.errors
        ? Object.values(errData.errors).join('. ')
        : errData?.message ||
          errData?.error ||
          'Invalid or expired recovery code. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#fafbfc] dark:bg-[#09090b] bg-grid-pattern text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 transition-colors overflow-hidden">
      {/* Ambient Lighting Cones */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-transparent blur-[140px] pointer-events-none -z-0" />

      {/* Top Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between pt-2">
        <Logo size="sm" subtitle="IAM" />
        <ThemeToggle variant="segmented" />
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 my-auto w-full max-w-[460px] sm:max-w-[480px] mx-auto py-6">
        <div className="rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111116]/95 backdrop-blur-2xl shadow-xl shadow-zinc-950/5 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_20px_50px_-10px_rgba(0,0,0,0.7)] overflow-hidden transition-all">
          {/* Card Header with Centered Emblem */}
          <div className="p-7 sm:p-8 pb-4 sm:pb-5 text-center">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
              <KeyRound className="h-7 w-7 text-white stroke-[2.4]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {step === 'request' && 'Reset your password'}
              {step === 'confirm' && 'Verify & create password'}
              {step === 'success' && 'Password updated'}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 font-medium">
              {step === 'request' && 'Enter your username or email to receive a recovery code'}
              {step === 'confirm' && 'Enter the 6-digit code and your new password'}
              {step === 'success' && 'Your credentials have been securely updated'}
            </p>
          </div>

          {/* Card Body */}
          <div className="px-7 sm:px-8 pb-7 sm:pb-8">
            {error && (
              <div className="mb-4.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMsg && step === 'confirm' && (
              <div className="mb-4.5 rounded-xl border border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2.5 font-medium">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4.5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Username or email
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Enter your username or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    className="h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full mt-2 h-11 sm:h-12 font-bold text-sm sm:text-base rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Sending Code...</span>
                    </span>
                  ) : (
                    <span>Continue</span>
                  )}
                </Button>
              </form>
            )}

            {step === 'confirm' && (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    6-digit Recovery Code
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="000 000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    maxLength={6}
                    autoFocus
                    className="h-12 text-center tracking-widest font-mono text-xl rounded-xl border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    New password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 font-medium"
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Confirm new password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl border-zinc-300 dark:border-zinc-700/80 bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 font-medium"
                  />
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3.5 sm:p-4 bg-zinc-50 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm space-y-1.5">
                  <p className="text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-2 text-zinc-500 dark:text-zinc-400">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                      <Check className="h-3.5 w-3.5" /> Min 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                      <Check className="h-3.5 w-3.5" /> Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                      <Check className="h-3.5 w-3.5" /> Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                      <Check className="h-3.5 w-3.5" /> Numeric digit
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                      <Check className="h-3.5 w-3.5" /> Special symbol
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                      <Check className="h-3.5 w-3.5" /> Passwords match
                    </span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('request')
                      setError(null)
                    }}
                    className="w-1/3 text-sm h-11 sm:h-12 rounded-xl font-semibold border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !isPasswordValid || !passwordsMatch || otp.length < 6}
                    className="flex-1 text-sm sm:text-base font-bold h-11 sm:h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    <span>Reset Password</span>
                  </Button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-lg font-bold text-zinc-950 dark:text-white">
                    Password Reset Complete
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    Your password has been changed successfully. You can now log in with your new credentials.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 sm:h-12 font-bold text-sm sm:text-base rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer"
                >
                  Proceed to Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Internal Card Footer */}
          <div className="px-7 sm:px-8 py-4.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/50 text-center text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Remember your credentials?{' '}
            <Link
              to="/login"
              className="font-bold text-zinc-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Secured by Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
          <Shield className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>Secured by Vaultix IAM</span>
        </div>
      </main>

      {/* Screen Bottom Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pb-2 gap-3 font-medium">
        <p>&copy; {new Date().getFullYear()} Vaultix, Inc.</p>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setLegalModalType('terms')}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => setLegalModalType('privacy')}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setLegalModalType('security')}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            Security
          </button>
        </div>
      </footer>

      <LegalModal
        type={legalModalType}
        isOpen={!!legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  )
}
