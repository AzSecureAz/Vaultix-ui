import { useState, useEffect } from 'react'
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
      setError('Please provide a valid passkey name')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.updatePasskeyLabel(passkey.id, trimmed)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Failed to rename passkey:', err)
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to rename passkey.'
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
          <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-1 border border-zinc-200 dark:border-zinc-700">
            <Edit3 className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold">Rename Passkey</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Update the nickname for this passkey to easily identify it in the future.
          </p>
        </div>

        <form onSubmit={handleRename} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
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
              className={`h-9 text-xs rounded-lg transition-all ${
                error
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            />
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
              type="submit"
              disabled={loading || !label.trim()}
              className="text-xs h-9 px-4 cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
