import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

interface LogoutAllModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogoutAllModal({ isOpen, onClose }: LogoutAllModalProps) {
  const { logoutAll } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || typeof document === 'undefined') return null

  const handleLogoutAll = async () => {
    setError(null)
    setLoading(true)
    try {
      await logoutAll()
      onClose()
      navigate('/login')
    } catch (err: unknown) {
      console.error('Failed to sign out from all devices:', err)
      setError('Failed to complete sign out across all devices. Please try again.')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
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
          <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-1 border border-red-200 dark:border-red-900/50">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold">Sign out from everywhere?</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            This will immediately terminate all active sessions and refresh tokens across all browsers, mobile apps, and devices.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              You will be signed out of this current session and will need to log back in on every device you use.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium animate-in fade-in-50 duration-150">
              {error}
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
              variant="destructive"
              size="sm"
              onClick={handleLogoutAll}
              disabled={loading}
              className="text-xs h-9 px-3 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Signing out...</span>
                </>
              ) : (
                <span>Sign out from everywhere</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
