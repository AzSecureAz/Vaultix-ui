import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit3, Loader2, AlertCircle, X } from 'lucide-react'
import { authApi } from '@/features/auth/api/authApi'
import type { PasskeyItem } from '@/types/api'

interface RenamePasskeyModalProps {
  passkey: PasskeyItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RenamePasskeyModal({
  passkey,
  isOpen,
  onClose,
  onSuccess,
}: RenamePasskeyModalProps) {
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (passkey) {
      setLabel(passkey.label || '')
      setError(null)
    }
  }, [passkey])

  if (!isOpen || !passkey) return null

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) {
      const msg = 'Please provide a valid passkey name'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.updatePasskeyLabel(passkey.id, trimmed)
      toast.success('Passkey renamed successfully.')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to rename passkey:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to rename passkey.'
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
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
            <Edit3 className="h-6 w-6 stroke-[2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Rename Passkey</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            Update the friendly nickname for this authenticator to easily identify it in the future.
          </p>
        </div>

        <form onSubmit={handleRename} className="space-y-5 pt-1">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Passkey Name
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Work MacBook, YubiKey 5C"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                if (error) setError(null)
              }}
              disabled={loading}
              maxLength={128}
              autoFocus
              className={`h-11 sm:h-12 text-sm sm:text-base rounded-xl font-medium border-zinc-300 dark:border-zinc-700/80 transition-all ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                  : ''
              }`}
            />
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
              type="submit"
              disabled={loading || !label.trim()}
              className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md active:scale-95 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
