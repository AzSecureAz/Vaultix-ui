import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Smartphone, Loader2, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
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
      toast.success('Signed out from all other devices successfully.')
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
        onClose()
      }, 900)
    } catch (err: unknown) {
      console.error('Failed to sign out from other devices:', err)
      const msg = 'Failed to sign out from other devices. Please try again.'
      setError(msg)
      toast.error(msg)
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
      <div className="relative w-full max-w-lg p-7 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 border border-blue-200 dark:border-blue-900/50 shadow-xs">
            <Smartphone className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Sign out from other devices?</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            This will immediately terminate all active sessions and refresh tokens on your other phones, tablets, and computers.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium">
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <p className="leading-relaxed">
              Your current device session will remain active, so you will not be interrupted or logged out.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in-50 duration-150">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in-50 duration-150 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Signed out from all other devices successfully.</span>
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="h-11 px-4 text-sm font-semibold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleLogoutOther}
              disabled={loading || success}
              className="h-11 px-5 text-sm font-bold rounded-xl cursor-pointer bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Signing out others...</span>
                </>
              ) : success ? (
                <span>Signed out</span>
              ) : (
                <span>Sign out other sessions</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
