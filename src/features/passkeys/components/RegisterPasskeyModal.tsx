import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Fingerprint, Loader2, AlertCircle, ShieldCheck, X } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'
import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import type { PasskeyItem } from '@/types/api'

interface RegisterPasskeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newPasskey?: PasskeyItem) => void
}

export function RegisterPasskeyModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterPasskeyModalProps) {
  const { fetchProfile } = useAuthStore()
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Fetch registration options from Spring Security
      const options = await authApi.getPasskeyRegistrationOptions()

      // 2. Trigger browser authenticator ceremony (Touch ID / Face ID / Windows Hello / YubiKey)
      const attestation = await startRegistration({ optionsJSON: options })

      // 3. Submit attestation and passkey label back to Spring Security
      const desiredLabel = label.trim() || 'Passkey'
      await authApi.registerPasskey(attestation, desiredLabel)

      // 5. Refresh profile state (passkey_enabled -> true)
      await fetchProfile()

      // Reset and complete
      setLabel('')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Passkey registration error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Passkey creation was cancelled or timed out.')
      } else if (err.name === 'InvalidStateError') {
        setError('This authenticator has already been registered for your account.')
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to register passkey. Please try again.'
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setLabel('')
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
            <Fingerprint className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold">Create a Passkey</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Passkeys allow you to sign in safely using your fingerprint, face scan, screen lock PIN, or hardware security key.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Passkey Name <span className="text-zinc-400">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. MacBook Pro, Work YubiKey, Pixel 9"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                if (error) setError(null)
              }}
              disabled={loading}
              maxLength={128}
              className={`h-9 text-xs rounded-lg transition-all ${
                error
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            />
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              A recognizable nickname to identify this device in your passkeys list.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              When you click <strong className="font-semibold text-zinc-900 dark:text-zinc-200">Continue</strong>, your browser will prompt you to verify your biometrics or security key.
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
              type="submit"
              disabled={loading}
              className="text-xs h-9 px-4 cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying...</span>
                </span>
              ) : (
                <span>Continue</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
