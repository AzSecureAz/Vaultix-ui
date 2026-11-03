import { useState } from 'react'
import { toast } from 'sonner'
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
      toast.success('Passkey removed successfully.')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to delete passkey:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete passkey.'
      setError(msg)
      toast.error(msg)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-zinc-950 dark:text-zinc-50">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-6 right-6 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-2.5">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20 shadow-xs">
            <Trash2 className="h-6 w-6 stroke-[2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
            Delete Passkey
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            Are you sure you want to permanently remove <strong className="font-bold text-zinc-950 dark:text-white">&ldquo;{passkey.label || 'this passkey'}&rdquo;</strong>?
          </p>
        </div>

        <div className="space-y-5 pt-1">
          <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 flex items-start gap-3 text-xs sm:text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              You will no longer be able to use this device or physical security key to authenticate into your Vaultix account.
            </p>
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-semibold flex items-center gap-2 animate-in fade-in-50 duration-150">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleClose}
              disabled={loading}
              className="h-11 sm:h-12 px-5 text-sm sm:text-base font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
              className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl cursor-pointer bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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
