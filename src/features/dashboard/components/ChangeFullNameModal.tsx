import React, { useState, useEffect } from 'react'
import { User, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

const FULL_NAME_REGEX =
  /^(?!.* {2})(?!.*[-'] )(?!.* [-'])(?!.* \.)(?!.*--)(?!.*'')(?!.*\.\.)\p{L}[\p{L} '-.]{0,254}[\p{L}.]$/u

interface ChangeFullNameModalProps {
  isOpen: boolean
  onClose: () => void
  currentFullName?: string
}

export const ChangeFullNameModal: React.FC<ChangeFullNameModalProps> = ({
  isOpen,
  onClose,
  currentFullName,
}) => {
  const { fetchProfile } = useAuthStore()

  const isAdding = !currentFullName || currentFullName.trim() === ''

  const [newFullName, setNewFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  /* Reset state when modal opens */
  useEffect(() => {
    if (isOpen) {
      setNewFullName(currentFullName || '')
      setError(null)
      setFieldErrors({})
      setSuccess(false)
    }
  }, [isOpen, currentFullName])

  const clean = newFullName.trim()
  const isValidFormat = FULL_NAME_REGEX.test(clean)
  const isDifferent = isAdding ? clean.length > 0 : clean !== (currentFullName || '').trim()
  const isFormValid = isValidFormat && isDifferent

  const handleClose = () => {
    setError(null)
    setFieldErrors({})
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!clean) {
      setFieldErrors({ fullName: 'Full name is required' })
      return
    }

    if (!isAdding && clean === (currentFullName || '').trim()) {
      setFieldErrors({ fullName: 'New full name cannot be identical to your current full name' })
      return
    }

    if (!isValidFormat) {
      setFieldErrors({
        fullName:
          'Full name must be 2-256 characters, start with a letter, end with a letter or dot, and contain only letters, spaces, hyphens, dots, or apostrophes',
      })
      return
    }

    setLoading(true)

    try {
      await authApi.updateFullName(clean)
      setSuccess(true)
      toast.success(isAdding ? 'Full name added successfully!' : 'Full name updated successfully!')
      await fetchProfile()
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object') {
        const mappedErrors: Record<string, string> = {}
        for (const [key, msg] of Object.entries(errData.errors)) {
          if (typeof msg === 'string') {
            if (key === 'full_name' || key === 'fullName') mappedErrors.fullName = msg
            else mappedErrors[key] = msg
          }
        }
        setFieldErrors(mappedErrors)
        toast.error('Please resolve the errors highlighted below')
      } else {
        const msg = errData?.message || errData?.error || 'Failed to update full name'
        setError(msg)
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
              {isAdding ? 'Full Name Added!' : 'Full Name Updated!'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Your profile display name is now{' '}
              <span className="font-bold text-zinc-950 dark:text-zinc-100">
                {clean}
              </span>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-1">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-md">
                <User className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {isAdding ? 'Add your full name' : 'Change your full name'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                {isAdding
                  ? 'Enter your display name to personalize your Vaultix account'
                  : 'Update the full name displayed on your Vaultix profile'}
              </p>
            </div>

            {/* General Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {isAdding ? 'Full name' : 'New full name'}
                  </label>
                  {!isAdding && currentFullName && (
                    <span className="text-zinc-500 text-xs truncate max-w-[220px]">
                      Current:{' '}
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">
                        {currentFullName}
                      </span>
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. John Doe"
                  value={newFullName}
                  onChange={(e) => {
                    setNewFullName(e.target.value)
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => {
                        const next = { ...prev }
                        delete next.fullName
                        return next
                      })
                    }
                  }}
                  autoComplete="name"
                  className={`h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                    fieldErrors.fullName
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                      : 'border-zinc-300 dark:border-zinc-700/80'
                  }`}
                />
                {fieldErrors.fullName ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.fullName}</span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium">
                    Letters, spaces, hyphens, dots, and apostrophes (2-256 chars)
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
                  disabled={loading || !isFormValid}
                  className="h-11 px-5 text-sm font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    <span>{isAdding ? 'Add full name' : 'Save changes'}</span>
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
