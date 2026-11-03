import React, { useState, useEffect } from 'react'
import { AtSign, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

interface ChangeUsernameModalProps {
  isOpen: boolean
  onClose: () => void
  currentUsername: string
}

export const ChangeUsernameModal: React.FC<ChangeUsernameModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
}) => {
  const { fetchProfile } = useAuthStore()

  const [newUsername, setNewUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setNewUsername('')
      setError(null)
      setFieldErrors({})
      setSuccess(false)
    }
  }, [isOpen])

  const isValidFormat =
    newUsername.length >= 3 &&
    newUsername.length <= 128 &&
    /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(newUsername)

  const isDifferent = newUsername.toLowerCase() !== currentUsername.toLowerCase()

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

    const clean = newUsername.trim().toLowerCase()

    if (clean === currentUsername.toLowerCase()) {
      setFieldErrors({ username: 'New username cannot be identical to your current username' })
      return
    }

    if (!isValidFormat) {
      setFieldErrors({
        username: 'Must be 3-128 chars, start and end with lowercase alphanumeric, dots or hyphens allowed in between',
      })
      return
    }

    setLoading(true)

    try {
      await authApi.changeUsername(clean)
      setSuccess(true)
      toast.success('Username changed successfully!')
      await fetchProfile()
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object') {
        setFieldErrors(errData.errors)
        toast.error('Please resolve the errors highlighted below')
      } else {
        const msg = errData?.message || errData?.error || 'Failed to update username'
        if (msg.toLowerCase().includes('taken') || msg.toLowerCase().includes('already')) {
          setFieldErrors({ username: msg })
        } else if (msg.toLowerCase().includes('same') || msg.toLowerCase().includes('current')) {
          setFieldErrors({ username: msg })
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
              Username Changed Successfully!
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Your handle is now <span className="font-mono font-bold text-zinc-950 dark:text-zinc-100">@{newUsername}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-1">
              <div className="h-12 w-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-md">
                <AtSign className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Change your username
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                Choose a new unique handle for your Vaultix account
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
                    New username
                  </label>
                  <span className="text-zinc-500 text-xs font-medium">
                    Current: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">@{currentUsername}</span>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm sm:text-base select-none font-bold">
                    @
                  </span>
                  <Input
                    type="text"
                    required
                    autoFocus
                    placeholder="newhandle"
                    value={newUsername}
                    onChange={(e) => {
                      const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')
                      setNewUsername(sanitized)
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.username
                          return next
                        })
                      }
                    }}
                    autoComplete="username"
                    className={`h-11 sm:h-12 pl-9 text-sm sm:text-base font-mono rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                      fieldErrors.username
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-300 dark:border-zinc-700/80'
                    }`}
                  />
                </div>
                {fieldErrors.username ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.username}</span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium">
                    3-128 chars, lowercase letters, numbers, dots, and hyphens
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
                    <span>Save username</span>
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
