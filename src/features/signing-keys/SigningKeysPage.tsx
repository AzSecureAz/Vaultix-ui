import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  KeyRound,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Check,
  Copy,
  FileCode,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'

interface SigningKey {
  id?: string
  kid: string
  algorithm: string
  key_use?: string
  public_key_pem?: string
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED'
  created_at: string
  created_by?: string
  updated_at?: string
  updated_by?: string
  expires_at?: string
  revoked_at?: string
}

export function SigningKeysPage() {
  const { hasRole, hasPermission } = useAuthStore()
  const canRead = hasPermission('key:read')
  const canRotate = hasPermission('key:rotate')
  const canRevoke = hasRole('ADMIN')

  const [keys, setKeys] = useState<SigningKey[]>([])
  const [loading, setLoading] = useState(true)
  const [rotating, setRotating] = useState(false)
  const [copiedKid, setCopiedKid] = useState<string | null>(null)
  const [copiedPem, setCopiedPem] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [fetchError, setFetchError] = useState<{ status?: number; message: string } | null>(null)

  const [searchParams, setSearchParams] = useSearchParams()

  // 1-indexed for users in URL (?page=1, ?page=5)
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawSize = parseInt(searchParams.get('size') || '10', 10)

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 0 : rawPage - 1
  const pageSize = [10, 20, 50].includes(rawSize) ? rawSize : 10

  // Server-side pagination metadata
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isFirst, setIsFirst] = useState(true)
  const [isLast, setIsLast] = useState(true)

  // Modals state
  const [selectedPemKey, setSelectedPemKey] = useState<SigningKey | null>(null)
  const [keyToRevoke, setKeyToRevoke] = useState<SigningKey | null>(null)
  const [revoking, setRevoking] = useState(false)

  const fetchKeys = async (page = currentPage, size = pageSize, isSilent = false) => {
    if (!canRead) {
      if (!isSilent) {
        setLoading(false)
      }
      setFetchError({
        status: 403,
        message: 'Access denied: You do not have permission to view registered signing keys (requires key:read).',
      })
      setKeys([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
      return
    }

    try {
      if (!isSilent) {
        setLoading(true)
      }
      setFetchError(null)
      const res = await apiClient.get(`/auth/admin/signing-keys?page=${page}&size=${size}`)
      if (res.data?.success && res.data.data) {
        const data = res.data.data
        const items: SigningKey[] = data.content || []
        setKeys(items)

        // Read from via-dto page metadata
        const pageInfo = data.page
        const total = pageInfo?.total_elements ?? data.total_elements ?? data.totalElements ?? items.length
        const pages = pageInfo?.total_pages ?? data.total_pages ?? data.totalPages ?? Math.max(1, Math.ceil(total / size))
        const pageNum = pageInfo?.number ?? data.number ?? page

        setTotalElements(total)
        setTotalPages(pages)
        setIsFirst(pageNum === 0)
        setIsLast(pageNum >= pages - 1)

        // Auto-correct page if query param exceeds total pages
        if (page >= pages && pages > 0) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.set('page', String(pages))
            next.set('size', String(size))
            return next
          }, { replace: true })
        }
      } else {
        const errorMsg = res.data?.message || 'Failed to retrieve cryptographic signing keys.'
        setFetchError({ message: errorMsg, status: res.status })
        setKeys([])
        setTotalElements(0)
        setTotalPages(1)
        setIsFirst(true)
        setIsLast(true)
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to retrieve cryptographic signing keys.'
      const status = err?.response?.status

      setFetchError({
        message: errorMsg,
        status,
      })
      setKeys([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
    } finally {
      if (!isSilent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchKeys(currentPage, pageSize)
  }, [currentPage, pageSize, canRead])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && !loading) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(newPage + 1))
        next.set('size', String(pageSize))
        return next
      })
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', '1')
      next.set('size', String(newSize))
      return next
    })
  }

  const handleRotate = async () => {
    setRotating(true)
    setMessage(null)
    try {
      const res = await apiClient.post('/auth/admin/signing-keys/rotate')
      if (res.data?.success) {
        setMessage({ text: 'RSA-2048 signing key successfully generated and activated.', type: 'success' })
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('page', '1')
          next.set('size', String(pageSize))
          return next
        })
        await fetchKeys(0, pageSize)
      }
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      const errorMsg =
        err?.response?.data?.message ||
        (isSudoCancelled
          ? 'Key rotation cancelled: Sudo elevation is required.'
          : 'Failed to rotate cryptographic signing key.')
      toast.error(errorMsg)
    } finally {
      setRotating(false)
    }
  }

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) return
    setRevoking(true)
    setMessage(null)
    const targetKid = keyToRevoke.kid
    try {
      const res = await apiClient.post(`/auth/admin/signing-keys/${encodeURIComponent(targetKid)}/revoke`)
      if (res.data?.success) {
        setKeyToRevoke(null)

        // Optimistically update key in-place to avoid unmounting list & preserve scroll position
        setKeys((prev) =>
          prev.map((key) =>
            key.kid === targetKid
              ? { ...key, status: 'REVOKED', revoked_at: new Date().toISOString() }
              : key
          )
        )

        // Silent background sync
        await fetchKeys(currentPage, pageSize, true)
      }
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      const errorMsg =
        err?.response?.data?.message ||
        (isSudoCancelled
          ? 'Key revocation cancelled: Sudo elevation is required.'
          : `Failed to revoke signing key '${keyToRevoke.kid}'.`)
      toast.error(errorMsg)
    } finally {
      setRevoking(false)
    }
  }

  const copyToClipboard = (text: string, type: 'kid' | 'pem') => {
    navigator.clipboard.writeText(text)
    if (type === 'kid') {
      setCopiedKid(text)
      setTimeout(() => setCopiedKid(null), 2000)
    } else {
      setCopiedPem(true)
      setTimeout(() => setCopiedPem(false), 2000)
    }
  }

  const downloadPemFile = (key: SigningKey) => {
    if (!key.public_key_pem) return
    const blob = new Blob([key.public_key_pem], { type: 'application/x-pem-file' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${key.kid}-public.pem`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const activeKey = keys.find((k) => k.status === 'ACTIVE')
  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Cryptographic Key Lifecycle
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Asymmetric RSA-2048 signing keys encrypted with AES-256 GCM Key Encryption Key (KEK)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {canRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchKeys(currentPage, pageSize)}
              disabled={loading}
              className="h-9 gap-2 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}

          {canRotate && (
            <Button
              size="sm"
              onClick={handleRotate}
              disabled={rotating}
              className="h-9 gap-2 text-xs font-medium shadow-xs transition-all bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rotating ? 'animate-spin' : ''}`} />
              <span>Rotate Key Immediately</span>
            </Button>
          )}
        </div>
      </div>

      {/* Banner Feedback Message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Key Stats Overview */}
      {canRead && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Managed Keys
              </p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {fetchError ? '—' : totalElements}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <KeyRound className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Active Signing Key
              </p>
              <p
                className={`text-xs font-mono font-bold truncate mt-1 ${
                  fetchError
                    ? 'text-zinc-400 dark:text-zinc-500'
                    : activeKey
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {fetchError ? 'Unavailable' : activeKey ? activeKey.kid : 'None active'}
              </p>
            </div>
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                fetchError
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Page Items
              </p>
              <p className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {fetchError ? '0' : keys.length}{' '}
                <span className="text-xs font-normal text-zinc-400">/ {pageSize}</span>
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/* Keys List Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Registered Cryptographic Keys</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Keys used by Authorization Service to sign JWTs and consumed by Resource Servers via JWKS
            </CardDescription>
          </div>

          {/* Rows per page selector */}
          {canRead && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Rows per page:
              </span>
              <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900/80">
                {[10, 20, 50].map((sizeOption) => (
                  <button
                    key={sizeOption}
                    type="button"
                    onClick={() => handlePageSizeChange(sizeOption)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      pageSize === sizeOption
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {sizeOption}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading && keys.length === 0 ? (
            <div className="py-14 text-center text-zinc-500 text-xs">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                <span>Loading signing keys...</span>
              </div>
            </div>
          ) : fetchError ? (
            <div className="py-14 px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3 shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {fetchError.status === 403 ? 'Access Restricted' : 'Unable to Retrieve Signing Keys'}
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {fetchError.message}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {fetchError.status !== 403 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchKeys(currentPage, pageSize)}
                    className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </Button>
                )}
              </div>
            </div>
          ) : keys.length === 0 ? (
            <div className="py-14 text-center text-zinc-500 text-xs">
              No signing keys found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {keys.map((key) => {
                const isActive = key.status === 'ACTIVE'
                const isRotated = key.status === 'ROTATED'
                const isRevoked = key.status === 'REVOKED'

                return (
                  <div
                    key={key.kid}
                    className="p-4 sm:px-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white break-all">
                          {key.kid}
                        </span>
                        <Badge
                          variant={isActive ? 'success' : isRotated ? 'secondary' : 'destructive'}
                          className="text-[10px] px-2 py-0 capitalize"
                        >
                          {key.status ? key.status.toLowerCase() : 'unknown'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {key.algorithm || 'RS256'}
                        </Badge>
                        {key.key_use && (
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-zinc-500">
                            use: {key.key_use}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                          Created: {new Date(key.created_at).toLocaleString()}
                        </span>
                        {key.updated_at && (
                          <span>Updated: {new Date(key.updated_at).toLocaleDateString()}</span>
                        )}
                        {key.expires_at && (
                          <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                        )}
                        {key.revoked_at && (
                          <span className="text-red-500 dark:text-red-400 font-medium">
                            Revoked: {new Date(key.revoked_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(key.kid, 'kid')}
                        className="text-[11px] gap-1.5 h-7.5 px-2.5 cursor-pointer font-medium"
                      >
                        {copiedKid === key.kid ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-zinc-400" />
                            <span>Copy KID</span>
                          </>
                        )}
                      </Button>

                      {key.public_key_pem && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPemKey(key)}
                          className="text-[11px] gap-1.5 h-7.5 px-2.5 cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border-blue-200 dark:border-blue-900/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                        >
                          <FileCode className="h-3 w-3" />
                          <span>View PEM</span>
                        </Button>
                      )}

                      {canRevoke && !isRevoked && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setKeyToRevoke(key)}
                          disabled={isActive}
                          title={isActive ? 'Active signing key cannot be revoked. Rotate first.' : 'Revoke this rotated signing key'}
                          className={`text-[11px] gap-1.5 h-7.5 px-2.5 font-medium transition-all ${
                            isActive
                              ? 'opacity-40 cursor-not-allowed text-zinc-400 border-zinc-200 dark:border-zinc-800'
                              : 'cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40'
                          }`}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Revoke</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Pagination Bar */}
          {!fetchError && totalElements > 0 && (
            <div className="p-3.5 sm:px-6 border-t border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{startRecord}</span> to{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{endRecord}</span> of{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalElements}</span> keys
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mr-1">
                  Page {currentPage + 1} of {Math.max(1, totalPages)}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={isFirst || loading}
                    className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={isLast || loading}
                    className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: View Public Key PEM */}
      {selectedPemKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Public Key Certificate (PEM)</span>
                </h3>
                <p
                  className="text-xs text-zinc-500 font-mono mt-0.5 truncate"
                  title={selectedPemKey.kid}
                >
                  {selectedPemKey.kid}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPemKey(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer shrink-0 -mr-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-zinc-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-64 border border-zinc-800 select-all leading-relaxed">
                {selectedPemKey.public_key_pem}
              </pre>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectedPemKey.public_key_pem && copyToClipboard(selectedPemKey.public_key_pem, 'pem')}
                  className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
                >
                  {copiedPem ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied PEM</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadPemFile(selectedPemKey)}
                  className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
                >
                  <Download className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Download .pem</span>
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedPemKey(null)}
                className="h-8 text-xs px-4 cursor-pointer ml-auto sm:ml-0"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Revoke Key Confirmation */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Revoke Signing Key
                </h3>
                <p className="text-xs text-zinc-500">
                  This action is permanent and requires Sudo elevation.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300 space-y-1.5 leading-relaxed">
              <p className="font-semibold">Security Warning:</p>
              <p>
                Revoking key <span className="font-mono font-bold break-all">{keyToRevoke.kid}</span> will immediately invalidate all JWTs signed with this key. Resource servers will reject them upon cache expiry.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setKeyToRevoke(null)}
                disabled={revoking}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleRevokeConfirm}
                disabled={revoking}
                className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {revoking ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Revocation</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
