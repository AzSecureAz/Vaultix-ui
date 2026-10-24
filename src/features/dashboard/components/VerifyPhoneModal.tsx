import React, { useState, useEffect } from 'react'
import { Phone, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

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

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

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
    }
  }, [isOpen])

  const handleSendVerification = async () => {
    setError(null)
    setResending(true)
    try {
      await authApi.sendPhoneNumberVerification()
      setCountdown(60)
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Failed to dispatch SMS verification code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.verifyPhoneNumber(cleanOtp)
      setSuccess(true)
      await fetchProfile()
      setTimeout(() => {
        onClose()
      }, 1500)
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
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Phone Number Verified Successfully!
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your phone number <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{phoneNumber}</span> has been confirmed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Verify your phone number
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                We sent a 6-digit verification code to{' '}
                <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200">{phoneNumber}</span>.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-4">
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
