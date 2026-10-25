import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Smartphone, Loader2, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

interface LogoutOtherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function LogoutOtherModal({ isOpen, onClose, onSuccess }: LogoutOtherModalProps) {
  const { logoutOther } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen || typeof document === 'undefined') return null

  const handleLogoutOther = async () => {
    setError(null)
    setLoading(true)
    try {
      await logoutOther()
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
        onClose()
      }, 900)
    } catch (err: unknown) {
      console.error('Failed to sign out from other devices:', err)
      setError('Failed to sign out from other devices. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1 border border-blue-200 dark:border-blue-900/50">
            <Smartphone className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold">Sign out from other devices?</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            This will immediately terminate all active sessions and refresh tokens on your other phones, tablets, and computers.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <p className="leading-relaxed">
              Your current device session will remain active, so you will not be interrupted or logged out.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium animate-in fade-in-50 duration-150">
              {error}
            </p>
          )}

          {success && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in-50 duration-150 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Signed out from all other devices successfully.</span>
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="text-xs h-9 px-3 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleLogoutOther}
              disabled={loading || success}
              className="text-xs h-9 px-3 cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Signing out others...</span>
                </>
              ) : success ? (
                <span>Done</span>
              ) : (
                <span>Sign out other devices</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
