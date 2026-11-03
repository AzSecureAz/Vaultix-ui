import { useState } from 'react'
import { toast } from 'sonner'
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

      // 4. Refresh profile state (passkey_enabled -> true)
      await fetchProfile()

      toast.success('Passkey registered successfully! You can now use it for instant biometric sign-in.')

      // Reset and complete
      setLabel('')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Passkey registration error:', err)
      let msg = 'Failed to register passkey. Please try again.'
      if (err.name === 'NotAllowedError') {
        msg = 'Passkey creation was cancelled or timed out.'
      } else if (err.name === 'InvalidStateError') {
        msg = 'This authenticator has already been registered for your account.'
      } else {
        msg = err?.response?.data?.message || err?.message || msg
      }
      setError(msg)
      toast.error(msg)
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
            <Fingerprint className="h-6 w-6 stroke-[2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Register a New Passkey</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            Passkeys allow you to sign in safely using your fingerprint, face scan, screen lock PIN, or hardware security key (Touch ID, Windows Hello, YubiKey).
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 pt-1">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Passkey Name <span className="text-zinc-400 font-normal">(optional)</span>
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
              className={`h-11 sm:h-12 text-sm sm:text-base rounded-xl font-medium border-zinc-300 dark:border-zinc-700/80 transition-all ${
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                  : ''
              }`}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              A recognizable nickname to identify this device in your passkeys list.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              When you click <strong className="font-bold text-zinc-950 dark:text-white">Continue</strong>, your browser or operating system will open a prompt to verify your biometrics or security key.
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
              type="submit"
              disabled={loading}
              className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md active:scale-95 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Prompting Authenticator...</span>
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
