import React, { useState, useEffect } from 'react'
import { Phone, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { maskPhoneNumber } from '@/lib/utils'

interface VerifyPhoneModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
}

export const VerifyPhoneModal: React.FC<VerifyPhoneModalProps> = ({
  isOpen,
  onClose,
  phoneNumber,
}) => {
  const { fetchProfile } = useAuthStore()

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [initialSent, setInitialSent] = useState(false)
  const [showPhone, setShowPhone] = useState(false)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendVerification = async () => {
    setError(null)
    setResending(true)
    try {
      await authApi.sendPhoneNumberVerification()
      setCountdown(60)
      toast.success(`Verification code dispatched to ${phoneNumber}`)
    } catch (err: any) {
      const errData = err?.response?.data
      const msg = errData?.message || 'Failed to dispatch SMS verification code. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setResending(false)
    }
  }

  // Automatically trigger OTP dispatch when modal opens
  useEffect(() => {
    if (isOpen && !initialSent) {
      setInitialSent(true)
      handleSendVerification()
    }
    if (!isOpen) {
      setOtp('')
      setError(null)
      setSuccess(false)
      setInitialSent(false)
      setShowPhone(false)
    }
  }, [isOpen])

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
      await authApi.verifyPhoneNumber(cleanOtp)
      setSuccess(true)
      toast.success('Phone number verified successfully!')
      await fetchProfile()
      setTimeout(() => {
        onClose()
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-7 sm:p-8 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-6 text-center space-y-3.5">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              Phone Number Verified Successfully!
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Your phone number{' '}
              <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-950 dark:text-zinc-100">
                <span>{showPhone ? phoneNumber : maskPhoneNumber(phoneNumber)}</span>
                <button
                  type="button"
                  onClick={() => setShowPhone(!showPhone)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded"
                  title={showPhone ? 'Hide phone number' : 'Show phone number'}
                >
                  {showPhone ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </span>{' '}
              has been confirmed.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Phone className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Verify your phone number
              </h2>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed flex items-center justify-center gap-1.5 flex-wrap font-medium">
                <span>We sent a 6-digit verification code to</span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-950 dark:text-white">
                  <span>{showPhone ? phoneNumber : maskPhoneNumber(phoneNumber)}</span>
                  <button
                    type="button"
                    onClick={() => setShowPhone(!showPhone)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer rounded"
                    title={showPhone ? 'Hide phone number' : 'Show phone number'}
                  >
                    {showPhone ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
                <span>.</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-4.5">
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
                    error ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-zinc-300 dark:border-zinc-700/80'
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
                className="w-full h-11 sm:h-12 font-bold text-sm sm:text-base rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  <span>Verify Phone Number</span>
                )}
              </Button>
            </form>

            {/* Resend Action */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-center">
              <button
                type="button"
                disabled={countdown > 0 || resending}
                onClick={handleSendVerification}
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
