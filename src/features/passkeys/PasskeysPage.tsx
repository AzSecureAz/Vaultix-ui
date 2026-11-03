import { useState, useEffect, useCallback } from 'react'
import {
  Fingerprint,
  Plus,
  Laptop,
  Smartphone,
  Key,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { authApi } from '@/features/auth/api/authApi'
import { RegisterPasskeyModal } from './components/RegisterPasskeyModal'
import { RenamePasskeyModal } from './components/RenamePasskeyModal'
import { DeletePasskeyModal } from './components/DeletePasskeyModal'
import type { PasskeyItem } from '@/types/api'

export function PasskeysPage() {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [selectedPasskey, setSelectedPasskey] = useState<PasskeyItem | null>(null)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const fetchPasskeys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authApi.getPasskeys()
      if (res.success && res.data) {
        setPasskeys(res.data)
      }
    } catch (err: any) {
      console.error('Failed to load passkeys:', err)
      const msg = err?.response?.data?.message || 'Failed to load registered passkeys.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPasskeys()
  }, [fetchPasskeys])

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Never'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const getTransportIcon = (transports?: string[]) => {
    if (!transports || transports.length === 0) {
      return <Fingerprint className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
    }
    const t = transports.map((s) => s.toLowerCase())
    if (t.includes('usb')) {
      return <Key className="h-6 w-6 text-amber-500 dark:text-amber-400" />
    }
    if (t.includes('internal')) {
      return <Laptop className="h-6 w-6 text-blue-500 dark:text-blue-400" />
    }
    if (t.includes('hybrid') || t.includes('ble') || t.includes('nfc')) {
      return <Smartphone className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
    }
    return <Fingerprint className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
  }

  return (
    <div className="space-y-7 sm:space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
          <Fingerprint className="h-4 w-4" />
          <span>Security &bull; Passwordless WebAuthn</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          FIDO2 Passkeys
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-medium">
          Sign in instantly using your fingerprint, face scan, screen lock, or hardware security keys.
        </p>
      </div>

      {/* Main Card: Registered Passkeys */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5">
              <span>Your Registered Passkeys</span>
              {passkeys.length > 0 && (
                <Badge variant="default" className="text-xs px-2.5 py-0.5 font-bold font-mono">
                  {passkeys.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Hardware authenticators and platform passkeys authorized to sign in to this account
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="h-10 sm:h-11 px-4 sm:px-5 text-sm font-bold rounded-xl cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md shrink-0 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Passkey</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 sm:p-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-pulse">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-20 rounded-xl" />
                    <Skeleton className="h-9 w-20 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 sm:p-12 text-center space-y-4">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </p>
              <Button
                variant="outline"
                size="default"
                onClick={fetchPasskeys}
                className="text-sm font-bold h-9 px-4 rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                Retry
              </Button>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="p-10 sm:p-16 text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <Fingerprint className="h-8 w-8 stroke-[1.8]" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  No passkeys registered yet
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
                  Add your computer, phone, or hardware security key (Touch ID, Windows Hello, YubiKey) to log in instantly without passwords.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="mt-2 h-10 px-5 text-sm font-bold rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span>Register Your First Passkey</span>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs mt-0.5 sm:mt-0">
                      {getTransportIcon(pk.transports)}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                          {pk.label || 'Passkey'}
                        </span>
                        {pk.backup_state ? (
                          <Badge variant="success" dot className="text-xs py-0.5 px-2 font-semibold">
                            Synced Passkey
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs py-0.5 px-2 font-semibold text-zinc-700 dark:text-zinc-300">
                            Device-bound
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Added {formatDate(pk.created_at)}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Last used: {formatDate(pk.last_used_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPasskey(pk)
                        setIsRenameOpen(true)
                      }}
                      className="h-9 px-3.5 text-xs sm:text-sm font-bold rounded-xl border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shadow-xs active:scale-95"
                      title="Rename passkey"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                      <span>Rename</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPasskey(pk)
                        setIsDeleteOpen(true)
                      }}
                      className="h-9 px-3.5 text-xs sm:text-sm font-bold rounded-xl border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shadow-xs active:scale-95"
                      title="Delete passkey"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <RegisterPasskeyModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={fetchPasskeys}
      />

      <RenamePasskeyModal
        passkey={selectedPasskey}
        isOpen={isRenameOpen}
        onClose={() => {
          setIsRenameOpen(false)
          setSelectedPasskey(null)
        }}
        onSuccess={fetchPasskeys}
      />

      <DeletePasskeyModal
        passkey={selectedPasskey}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedPasskey(null)
        }}
        onSuccess={fetchPasskeys}
      />
    </div>
  )
}
