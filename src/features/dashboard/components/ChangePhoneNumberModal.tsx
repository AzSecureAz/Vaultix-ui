import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

interface ChangePhoneNumberModalProps {
  isOpen: boolean
  onClose: () => void
  currentPhoneNumber?: string
}

export const ChangePhoneNumberModal: React.FC<ChangePhoneNumberModalProps> = ({
  isOpen,
  onClose,
  currentPhoneNumber,
}) => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
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
      setNewPhoneNumber('')
      setOtp('')
      setError(null)
      setFieldErrors({})
      setSuccess(false)
      setCountdown(60)
    }
  }, [isOpen])

  // International phone validation regex (E.164 standard: + followed by 7 to 15 digits)
  const isValidPhone = /^\+[1-9]\d{6,14}$/.test(newPhoneNumber.trim().replace(/[\s-]/g, ''))
  const isDifferent =
    !currentPhoneNumber ||
    newPhoneNumber.trim().replace(/[\s-]/g, '') !== currentPhoneNumber.trim().replace(/[\s-]/g, '')

  const handleClose = () => {
    setError(null)
    setFieldErrors({})
    onClose()
  }

  // Step 1: Request phone number change / add (sends OTP to new phone number)
  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const clean = newPhoneNumber.trim().replace(/[\s-]/g, '')

    if (currentPhoneNumber && clean === currentPhoneNumber.trim().replace(/[\s-]/g, '')) {
      setFieldErrors({ newPhoneNumber: 'New phone number cannot be the same as your current phone number' })
      return
    }

    if (!isValidPhone) {
      setFieldErrors({
        newPhoneNumber: 'Please enter a valid international phone number (e.g. +916387778976, +14155552671)',
      })
      return
    }

    setLoading(true)

    try {
      await authApi.requestPhoneNumberChange(clean)
      setStep('verify')
      setCountdown(60)
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object') {
        setFieldErrors(errData.errors)
      } else {
        const msg = errData?.message || errData?.error || 'Failed to request phone number verification code'
        if (
          msg.toLowerCase().includes('already') ||
          msg.toLowerCase().includes('registered') ||
          msg.toLowerCase().includes('taken')
        ) {
          setFieldErrors({ newPhoneNumber: msg })
        } else if (msg.toLowerCase().includes('same as')) {
          setFieldErrors({ newPhoneNumber: msg })
        } else {
          setError(msg)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP to the new phone number
  const handleResendOtp = async () => {
    setError(null)
    setResending(true)
    try {
      const clean = newPhoneNumber.trim().replace(/[\s-]/g, '')
      await authApi.requestPhoneNumberChange(clean)
      setCountdown(60)
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Failed to resend verification code. Please wait and try again.')
    } finally {
      setResending(false)
    }
  }

  // Step 2: Confirm OTP and finalize phone change
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
      await authApi.confirmPhoneNumberChange(cleanOtp)
      setSuccess(true)

      // Since backend revokes active sessions on phone number change for security,
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

  const isAdding = !currentPhoneNumber

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
        {!success && step === 'verify' && (
          <button
            type="button"
            onClick={() => {
              setStep('request')
              setError(null)
              setOtp('')
            }}
            className="absolute left-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {isAdding ? 'Phone Number Added Successfully!' : 'Phone Number Changed Successfully!'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your phone number has been updated to{' '}
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{newPhoneNumber}</span>.
              Active sessions have been invalidated for security. Redirecting to login...
            </p>
            <div className="pt-2 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </div>
          </div>
        ) : step === 'request' ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isAdding ? 'Add Phone Number' : 'Change Phone Number'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {isAdding
                  ? "Enter your international phone number. We'll send an SMS verification code to confirm ownership."
                  : "Enter your new international phone number. We'll send an SMS verification code to verify ownership."}
              </p>
            </div>

            {/* General Error (if not tied to field) */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRequestChange} className="space-y-4">
              {currentPhoneNumber && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Current Phone Number
                  </label>
                  <Input
                    type="text"
                    disabled
                    value={currentPhoneNumber}
                    className="h-10 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-mono text-xs border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {isAdding ? 'Phone Number' : 'New Phone Number'}
                </label>
                <PhoneInput
                  value={newPhoneNumber}
                  onChange={(val) => {
                    setNewPhoneNumber(val)
                    if (fieldErrors.newPhoneNumber || fieldErrors.new_phone_number) {
                      setFieldErrors({})
                    }
                    if (error) setError(null)
                  }}
                  hasError={!!(fieldErrors.newPhoneNumber || fieldErrors.new_phone_number)}
                  placeholder="98765 43210"
                />
                {(fieldErrors.newPhoneNumber || fieldErrors.new_phone_number) ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.newPhoneNumber || fieldErrors.new_phone_number}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Select country dial code &amp; enter phone number
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || !newPhoneNumber.trim() || !isValidPhone || !isDifferent}
                  className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending verification code...</span>
                    </span>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Verification */
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Confirm phone verification
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                We sent a 6-digit verification code to{' '}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{newPhoneNumber}</span>.
              </p>
            </div>

            {/* Form */}
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
                    error
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying & updating...</span>
                  </span>
                ) : (
                  <span>Confirm Phone Number</span>
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
