import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Lock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  username,
}) => {
  const navigate = useNavigate()
  const [typedUsername, setTypedUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTypedUsername('')
      setError(null)
      setSuccess(false)
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isConfirmed = typedUsername.trim() === username.trim()

  const handleClose = () => {
    if (!loading && !success) {
      setError(null)
      onClose()
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConfirmed || loading) return

    setError(null)
    setLoading(true)

    try {
      await authApi.deleteAccount()
      setSuccess(true)

      // Wipe client auth credentials
      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isInitializing: false,
      })

      // Short delay so the user sees the confirmation before redirect
      setTimeout(() => {
        onClose()
        navigate('/login', {
          replace: true,
          state: {
            info: 'Your account has been deleted. You have 90 days to contact support if this was a mistake.',
          },
        })
      }, 1800)
    } catch (err: any) {
      const errData = err?.response?.data
      const msg =
        errData?.message ||
        errData?.error ||
        'Failed to delete account. Please ensure your elevation is valid and try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Close Button */}
        {!loading && !success && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
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
              Account Deleted Successfully
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Your account is now scheduled for permanent purge in 90 days. All active sessions have been signed out. Redirecting to login...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3 border border-red-200 dark:border-red-900/50">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Delete Account
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Permanently schedule your Vaultix account for deletion.
              </p>
            </div>

            {/* Warning Banner */}
            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 space-y-2 text-xs text-red-800 dark:text-red-300">
              <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>90-Day Retention Policy</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-red-700 dark:text-red-300/90">
                <li>
                  All active sessions, credentials, and refresh tokens will be terminated immediately.
                </li>
                <li>
                  Your account data will remain soft-deleted for <strong>90 days</strong> before permanent purge. You can contact support to recover it within this window.
                </li>
                <li>
                  An alert will be sent to your registered email address.
                </li>
              </ul>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDelete} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  To confirm, type your username{' '}
                  <span className="font-mono font-semibold text-zinc-950 dark:text-white">
                    {username}
                  </span>
                </label>
                <Input
                  type="text"
                  required
                  autoFocus
                  placeholder={username}
                  value={typedUsername}
                  onChange={(e) => setTypedUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  className="h-10 text-xs sm:text-sm font-mono rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all border-zinc-200 dark:border-zinc-800"
                />
              </div>

              {/* Sudo Hint */}
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                <Lock className="h-3 w-3 text-zinc-400 shrink-0" />
                <span>Requires fresh identity verification within 60 seconds (password, passkey, or authenticator).</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="h-9 px-3.5 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isConfirmed}
                  className="h-9 px-4 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting account...</span>
                    </span>
                  ) : (
                    <span>Delete this account</span>
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
