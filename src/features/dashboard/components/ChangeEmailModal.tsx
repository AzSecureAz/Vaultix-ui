import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

interface ChangeEmailModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
}) => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep('request')
      setNewEmail('')
      setOtp('')
      setError(null)
      setFieldErrors({})
      setSuccess(false)
      setCountdown(60)
    }
  }, [isOpen])

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())
  const isDifferent = newEmail.trim().toLowerCase() !== currentEmail.toLowerCase()

  const handleClose = () => {
    setError(null)
    setFieldErrors({})
    onClose()
  }

  // Step 1: Request email change (sends OTP to new email)
  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const clean = newEmail.trim().toLowerCase()

    if (clean === currentEmail.toLowerCase()) {
      setFieldErrors({ newEmail: 'New email cannot be the same as your current email' })
      return
    }

    if (!isValidEmail) {
      setFieldErrors({ newEmail: 'Please enter a valid email address' })
      return
    }

    setLoading(true)

    try {
      await authApi.requestEmailChange(clean)
      setStep('verify')
      setCountdown(60)
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object') {
        setFieldErrors(errData.errors)
      } else {
        const msg = errData?.message || errData?.error || 'Failed to request email change'
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('taken')) {
          setFieldErrors({ newEmail: msg })
        } else if (msg.toLowerCase().includes('same as')) {
          setFieldErrors({ newEmail: msg })
        } else {
          setError(msg)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP to the new email
  const handleResendOtp = async () => {
    setError(null)
    setResending(true)
    try {
      await authApi.requestEmailChange(newEmail.trim().toLowerCase())
      setCountdown(60)
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Failed to resend verification code. Please wait and try again.')
    } finally {
      setResending(false)
    }
  }

  // Step 2: Confirm OTP and finalize email change
  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.confirmEmailChange(cleanOtp)
      setSuccess(true)

      // Since backend revokes active sessions on email change for security,
      // redirect the user to login after 2 seconds
      setTimeout(async () => {
        await logout()
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Invalid or expired verification code')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Close Button */}
        {!success && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Back Button (if on verify step) */}
        {step === 'verify' && !success && (
          <button
            type="button"
            onClick={() => {
              setStep('request')
              setError(null)
            }}
            className="absolute left-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Email Changed Successfully!
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Your email has been updated to <span className="font-medium text-zinc-900 dark:text-zinc-200">{newEmail}</span>. For your security, all active sessions were terminated. Redirecting to sign in...
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Redirecting...</span>
            </div>
          </div>
        ) : step === 'request' ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Change your email
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Enter your new email address to receive a verification code
              </p>
            </div>

            {/* General Error Banner */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestChange} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    New email address
                  </label>
                  <span className="text-zinc-400 text-[11px] truncate max-w-[200px]">
                    Current: <span className="text-zinc-600 dark:text-zinc-300">{currentEmail}</span>
                  </span>
                </div>
                <Input
                  type="email"
                  required
                  autoFocus
                  placeholder="newemail@example.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value)
                    if (fieldErrors.newEmail || fieldErrors.new_email) {
                      setFieldErrors((prev) => {
                        const next = { ...prev }
                        delete next.newEmail
                        delete next.new_email
                        return next
                      })
                    }
                  }}
                  autoComplete="email"
                  className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                    fieldErrors.newEmail || fieldErrors.new_email
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
                {(fieldErrors.newEmail || fieldErrors.new_email) && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{fieldErrors.newEmail || fieldErrors.new_email}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-9 px-3.5 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isValidEmail || !isDifferent}
                  className="h-9 px-4 text-xs font-medium rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending code...</span>
                    </span>
                  ) : (
                    <span>Continue</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Verify your new email
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Enter the 6-digit code sent to{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-200 break-all">{newEmail}</span>.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleConfirmChange} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Verification Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                    if (error) setError(null)
                  }}
                  className={`h-12 text-center text-xl font-mono font-semibold tracking-[0.4em] rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                    error ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Confirming...</span>
                  </span>
                ) : (
                  <span>Confirm Email Change</span>
                )}
              </Button>
            </form>

            {/* Resend Action */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-center">
              <button
                type="button"
                disabled={countdown > 0 || resending}
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : countdown > 0 ? (
                  <span>Resend code in {countdown}s</span>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    <span>Didn't receive code? Resend</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
