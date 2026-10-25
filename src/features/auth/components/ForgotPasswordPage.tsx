import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
      setInfoMsg(
        res.message ||
          'If an account exists, a 6-digit recovery code has been sent to your email.'
      )
      setStep('confirm')
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors) {
        setError(Object.values(errData.errors).join('. '))
      } else {
        setError(errData?.message || 'Unable to process password reset request.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements.')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.')
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
      } else {
        setError(res.message || 'Password reset confirmation failed.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors) {
        setError(Object.values(errData.errors).join('. '))
      } else {
        setError(
          errData?.message ||
            errData?.error ||
            'Invalid or expired recovery code. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] bg-grid-pattern text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pt-2">
        <Logo size="sm" subtitle="IAM" />
        <ThemeToggle variant="segmented" />
      </header>

      {/* Clerk-Style Center Card */}
      <main className="my-auto w-full max-w-[400px] mx-auto py-6">
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-zinc-950/5 dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-all">
          {/* Card Header with Centered Emblem */}
          <div className="p-7 pb-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <KeyRound className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {step === 'request' && 'Reset your password'}
              {step === 'confirm' && 'Verify & create password'}
              {step === 'success' && 'Password updated'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {step === 'request' && 'Enter your username or email to receive a recovery code'}
              {step === 'confirm' && 'Enter the 6-digit code and your new password'}
              {step === 'success' && 'Your credentials have been securely updated'}
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

            {infoMsg && step === 'confirm' && (
              <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-3 py-2 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            )}

            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
                    className="h-10 text-xs sm:text-sm rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="w-full mt-2 h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    6-digit Recovery Code
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    maxLength={6}
                    autoFocus
                    className="h-11 text-center tracking-widest font-mono text-base rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    New password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 pr-10 text-xs sm:text-sm rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Confirm new password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 text-xs sm:text-sm rounded-lg border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900"
                  />
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-1">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-1 text-zinc-400 dark:text-zinc-500">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Min 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Numeric digit
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Special symbol
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Passwords match
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('request')
                      setError(null)
                    }}
                    className="w-1/3 text-xs h-10 rounded-lg"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !isPasswordValid || !passwordsMatch || otp.length < 6}
                    className="flex-1 text-xs h-10 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    <span>Reset Password</span>
                  </Button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Password Reset Complete
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your password has been changed successfully. You can now log in with your new credentials.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                >
                  Proceed to Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Internal Card Footer */}
          <div className="px-7 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Remember your credentials?{' '}
            <Link
              to="/login"
              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
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
