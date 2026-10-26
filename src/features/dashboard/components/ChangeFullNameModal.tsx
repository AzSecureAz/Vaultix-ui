import React, { useState, useEffect } from 'react'
import { User, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
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

  // Reset state when modal opens
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
      } else {
        const msg = errData?.message || errData?.error || 'Failed to update full name'
        setError(msg)
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

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {isAdding ? 'Full Name Added!' : 'Full Name Updated!'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your profile display name is now{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {clean}
              </span>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isAdding ? 'Add your full name' : 'Change your full name'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAdding
                  ? 'Enter your display name to personalize your Vaultix account'
                  : 'Update the full name displayed on your Vaultix profile'}
              </p>
            </div>

            {/* General Error Banner */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    {isAdding ? 'Full name' : 'New full name'}
                  </label>
                  {!isAdding && currentFullName && (
                    <span className="text-zinc-400 text-[11px] truncate max-w-[200px]">
                      Current:{' '}
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
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
                  className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                    fieldErrors.fullName
                      ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                />
                {fieldErrors.fullName ? (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{fieldErrors.fullName}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Letters, spaces, hyphens, dots, and apostrophes (2-256 chars)
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
                  disabled={loading || !isFormValid}
                  className="h-9 px-4 text-xs font-medium rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
