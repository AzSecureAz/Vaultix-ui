import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertCircle, AlertTriangle, X } from 'lucide-react'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import type { PasskeyItem } from '@/types/api'

interface DeletePasskeyModalProps {
  passkey: PasskeyItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeletePasskeyModal({
  passkey,
  isOpen,
  onClose,
  onSuccess,
}: DeletePasskeyModalProps) {
  const { fetchProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !passkey) return null

  const handleDelete = async () => {
    setError(null)
    setLoading(true)

    try {
      await authApi.deletePasskey(passkey.id)
      await fetchProfile()
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to delete passkey:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete passkey.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 text-zinc-900 dark:text-zinc-100">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2">
          <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-1 border border-red-200 dark:border-red-900/50">
            <Trash2 className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold">Delete Passkey</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Are you sure you want to remove <strong className="font-semibold text-zinc-900 dark:text-zinc-200">&ldquo;{passkey.label || 'this passkey'}&rdquo;</strong>?
          </p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="p-3 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              You will no longer be able to use this device or security key to sign in to your Vaultix account.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in-50 duration-150">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
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
              disabled={loading}
              onClick={handleDelete}
              className="text-xs h-9 px-4 cursor-pointer bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </span>
              ) : (
                <span>Delete Passkey</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
