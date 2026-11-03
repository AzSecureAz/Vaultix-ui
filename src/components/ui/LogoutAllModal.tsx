import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
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
      toast.success('Signed out from all devices successfully.')
      onClose()
      navigate('/login')
    } catch (err: unknown) {
      console.error('Failed to sign out from all devices:', err)
      const msg = 'Failed to complete sign out across all devices. Please try again.'
      setError(msg)
      toast.error(msg)
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
          <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-2 border border-red-200 dark:border-red-900/50 shadow-xs">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Sign out from everywhere?</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            This will immediately terminate all active sessions and refresh tokens across all browsers, mobile apps, and devices.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-medium">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed">
              You will be signed out of this current session and will need to log back in on every device you use.
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in-50 duration-150">
              {error}
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
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={loading}
              className="h-11 px-5 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
