import React, { useState } from 'react'
import { KeyRound, Check, CheckCircle2, AlertCircle, Loader2, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, fetchProfile } = useAuthStore()
  const isSettingPassword = user?.has_password === false || (user as any)?.hasPassword === false

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Password rules validation
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasDigit = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0

  const isFormValid =
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSpecial &&
    passwordsMatch

  const resetForm = () => {
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setError(null)
    setFieldErrors({})
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!isFormValid) {
      const errors: Record<string, string> = {}
      if (!hasMinLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        errors.newPassword = 'Password does not meet all complexity requirements'
      }
      if (!passwordsMatch) {
        errors.confirmPassword = 'Passwords do not match'
      }
      setFieldErrors(errors)
      toast.error('Please resolve the errors highlighted below')
      return
    }

    setLoading(true)

    try {
      await authApi.changePassword(newPassword)
      setSuccess(true)
      toast.success(isSettingPassword ? 'Password established successfully!' : 'Password updated successfully!')
      fetchProfile()
      
      /* Close modal after 1.8 seconds */
      setTimeout(() => {
        handleClose()
      }, 1800)
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object') {
        setFieldErrors(errData.errors)
        toast.error('Please resolve the indicated errors')
      } else {
        const msg = errData?.message || errData?.error || 'Failed to update password'
        if (msg.toLowerCase().includes('same as') || msg.toLowerCase().includes('current password')) {
          setFieldErrors({ newPassword: msg })
        } else {
          setError(msg)
        }
        toast.error(msg)
      }
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

        {success ? (
          <div className="py-6 text-center space-y-3.5">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isSettingPassword ? 'Password Set Successfully' : 'Password Changed Successfully'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto font-medium">
              {isSettingPassword
                ? 'Your password has been set. All other active sessions have been signed out for security.'
                : 'Your password has been updated. All other active sessions have been signed out for security.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-1">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-md">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {isSettingPassword ? 'Set your password' : 'Change your password'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {isSettingPassword
                  ? 'Choose a strong password to enable direct password sign-in for your account'
                  : 'Choose a strong, unique password to protect your account'}
              </p>
            </div>

            {/* General Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  New password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (fieldErrors.newPassword || fieldErrors.new_password) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.newPassword
                          delete next.new_password
                          return next
                        })
                      }
                    }}
                    className={`h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                      fieldErrors.newPassword || fieldErrors.new_password
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-300 dark:border-zinc-700/80'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {(fieldErrors.newPassword || fieldErrors.new_password) && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.newPassword || fieldErrors.new_password}</span>
                  </p>
                )}
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Confirm new password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.confirmPassword
                          return next
                        })
                      }
                    }}
                    className={`h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-300 dark:border-zinc-700/80'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Password Checklist */}
              <div className="p-3.5 sm:p-4 bg-zinc-50 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm space-y-1.5">
                <p className="text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                  Password requirements:
                </p>
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
                  disabled={loading || !isFormValid}
                  className="h-11 px-5 text-sm font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isSettingPassword ? 'Setting...' : 'Updating...'}</span>
                    </span>
                  ) : (
                    <span>{isSettingPassword ? 'Set password' : 'Update password'}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
