import { useState, useEffect, useCallback } from 'react'
import {
  Fingerprint,
  Plus,
  Loader2,
  Laptop,
  Smartphone,
  Key,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      setError(err?.response?.data?.message || 'Failed to load registered passkeys.')
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
      return <Fingerprint className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
    }
    const t = transports.map((s) => s.toLowerCase())
    if (t.includes('usb')) {
      return <Key className="h-5 w-5 text-amber-500 dark:text-amber-400" />
    }
    if (t.includes('internal')) {
      return <Laptop className="h-5 w-5 text-blue-500 dark:text-blue-400" />
    }
    if (t.includes('hybrid') || t.includes('ble') || t.includes('nfc')) {
      return <Smartphone className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
    }
    return <Fingerprint className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
          <Fingerprint className="h-4 w-4" />
          <span>Security &bull; Passwordless</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Passkeys
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Sign in instantly using your fingerprint, face scan, screen lock, or hardware security keys.
        </p>
      </div>

      {/* Main Card: Registered Passkeys */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>Your Registered Passkeys</span>
              {passkeys.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {passkeys.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Devices and security keys authorized to sign in to this account
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="h-8 px-3 text-xs font-medium cursor-pointer bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Passkey</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-xs">Loading passkeys...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPasskeys}
                className="text-xs h-8 px-3 cursor-pointer"
              >
                Retry
              </Button>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No passkeys registered yet
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Add your computer, phone, or hardware key to log in without passwords.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/80 mt-0.5 sm:mt-0">
                      {getTransportIcon(pk.transports)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {pk.label || 'Passkey'}
                        </span>
                        {pk.backup_state ? (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-emerald-500" />
                            Synced Passkey
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            Device-bound
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          <span>Added {formatDate(pk.created_at)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          <span>Last used: {formatDate(pk.last_used_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPasskey(pk)
                        setIsRenameOpen(true)
                      }}
                      className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                      title="Rename passkey"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      <span>Rename</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPasskey(pk)
                        setIsDeleteOpen(true)
                      }}
                      className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Delete passkey"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
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
