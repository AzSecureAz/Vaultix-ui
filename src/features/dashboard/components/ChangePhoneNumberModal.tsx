import React, { useState, useEffect } from 'react'
import { Phone, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { maskPhoneNumber } from '@/lib/utils'

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
  const { fetchProfile } = useAuthStore()

  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [showCurrentPhone, setShowCurrentPhone] = useState(false)
  const [showNewPhone, setShowNewPhone] = useState(false)

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
      setShowCurrentPhone(false)
      setShowNewPhone(false)
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
      toast.success(`Verification code dispatched to ${clean}`)
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object') {
        setFieldErrors(errData.errors)
        toast.error('Please resolve the errors below')
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
        toast.error(msg)
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
      toast.success('Verification code resent successfully')
    } catch (err: any) {
      const errData = err?.response?.data
      const msg = errData?.message || 'Failed to resend verification code. Please wait and try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setResending(false)
    }
  }

  // Step 2: Confirm OTP and finalize phone change
  const handleConfirmChange = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      const msg = 'Please enter a valid 6-digit verification code'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.confirmPhoneNumberChange(cleanOtp)
      setSuccess(true)
      toast.success(isAdding ? 'Phone number added successfully!' : 'Phone number updated successfully!')
      await fetchProfile()
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: any) {
      const errData = err?.response?.data
      const msg = errData?.message || 'Invalid or expired verification code'
      setError(msg)
      toast.error(msg)
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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-7 sm:p-8 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Close Button */}
        {!success && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
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
            className="absolute left-5 top-5 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3.5">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isAdding ? 'Phone Number Added Successfully!' : 'Phone Number Changed Successfully!'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Your phone number has been updated to{' '}
              <span className="font-mono font-bold text-zinc-950 dark:text-zinc-100">{newPhoneNumber}</span>.
            </p>
          </div>
        ) : step === 'request' ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Phone className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {isAdding ? 'Add Phone Number' : 'Change Phone Number'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                {isAdding
                  ? "Enter your international phone number. We'll send an SMS verification code to confirm ownership."
                  : "Enter your new international phone number. We'll send an SMS verification code to verify ownership."}
              </p>
            </div>

            {/* General Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRequestChange} className="space-y-4.5">
              {currentPhoneNumber && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Current Phone Number
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      disabled
                      value={showCurrentPhone ? currentPhoneNumber : maskPhoneNumber(currentPhoneNumber)}
                      className="h-11 sm:h-12 pr-11 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-mono text-sm border-zinc-300 dark:border-zinc-700/80 cursor-not-allowed select-none font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPhone(!showCurrentPhone)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded"
                      title={showCurrentPhone ? 'Hide phone number' : 'Show phone number'}
                    >
                      {showCurrentPhone ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                  size="lg"
                />
                {(fieldErrors.newPhoneNumber || fieldErrors.new_phone_number) ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 pt-1 animate-in fade-in-0 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.newPhoneNumber || fieldErrors.new_phone_number}</span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium">
                    Select country dial code &amp; enter mobile phone number
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-11 px-4 text-sm font-semibold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !newPhoneNumber.trim() || !isValidPhone || !isDifferent}
                  className="h-11 px-5 text-sm font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending code...</span>
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
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Phone className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Confirm phone verification
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                We sent a 6-digit verification code to{' '}
                <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-950 dark:text-white">
                  <span>{showNewPhone ? newPhoneNumber : maskPhoneNumber(newPhoneNumber)}</span>
                  <button
                    type="button"
                    onClick={() => setShowNewPhone(!showNewPhone)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded"
                    title={showNewPhone ? 'Hide phone number' : 'Show phone number'}
                  >
                    {showNewPhone ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
                .
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConfirmChange} className="space-y-4.5">
              <div className="space-y-2 text-center">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Verification Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="000 000"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                    if (error) setError(null)
                  }}
                  className={`h-12 text-center text-xl font-mono font-bold tracking-[0.4em] rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                    error
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-zinc-300 dark:border-zinc-700/80'
                  }`}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-11 sm:h-12 font-bold text-sm sm:text-base rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
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
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : countdown > 0 ? (
                  <span>Resend code in {countdown}s</span>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
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
