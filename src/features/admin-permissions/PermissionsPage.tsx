import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Layers,
  KeyRound,
  Users,
  Shield,
  Power,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { permissionsApi, type PermissionItem } from './api/permissionsApi'

const DOMAIN_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; bg: string; border: string }
> = {
  user: {
    label: 'User Management',
    icon: Users,
    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
  },
  role: {
    label: 'Role Governance',
    icon: Shield,
    bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
  },
  key: {
    label: 'Cryptographic Keys',
    icon: KeyRound,
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
  },
  permission: {
    label: 'Permissions Directory',
    icon: Lock,
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
  },
}

export function PermissionsPage() {
  const { hasRole, hasPermission } = useAuthStore()
  const isAdmin = hasRole('ADMIN')
  const canRead = hasPermission('permission:read') || isAdmin

  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [fetchError, setFetchError] = useState<{ status?: number; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(text)
    setTimeout(() => setCopiedId(null), 2000)
  }

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

  const fetchPermissions = async (page = currentPage, size = pageSize) => {
    if (!canRead) {
      setLoading(false)
      setFetchError({
        status: 403,
        message: 'Access denied: You do not have permission to view system permissions (requires permission:read or ADMIN role).',
      })
      setPermissions([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
      return
    }

    setLoading(true)
    setBannerMessage(null)
    setFetchError(null)
    try {
      const res = await permissionsApi.getPermissions(page, size)
      if (res.success && res.data) {
        setFetchError(null)
        const data = res.data
        const items = data.content || []
        setPermissions(items)

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
        const errorMsg = res.message || 'Failed to retrieve system permissions.'
        setFetchError({ message: errorMsg })
        setPermissions([])
        setTotalElements(0)
        setTotalPages(1)
        setIsFirst(true)
        setIsLast(true)
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to retrieve system permissions.'
      const status = err?.response?.status

      setFetchError({
        message: errorMsg,
        status,
      })
      setPermissions([])
      setTotalElements(0)
      setTotalPages(1)
      setIsFirst(true)
      setIsLast(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions(currentPage, pageSize)
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

  const handleToggleStatus = async (perm: PermissionItem) => {
    if (!isAdmin || actionLoadingId) return
    const isCurrentlyEnabled = perm.status === 'ENABLED'
    const action = isCurrentlyEnabled ? 'disable' : 'enable'

    setActionLoadingId(perm.id)
    setBannerMessage(null)

    try {
      if (isCurrentlyEnabled) {
        await permissionsApi.disablePermission(perm.name)
        setBannerMessage({ text: `Permission '${perm.name}' has been disabled.`, type: 'success' })
      } else {
        await permissionsApi.enablePermission(perm.name)
        setBannerMessage({ text: `Permission '${perm.name}' has been enabled.`, type: 'success' })
      }

      // Update item in local list
      setPermissions((prev) =>
        prev.map((item) =>
          item.id === perm.id
            ? { ...item, status: isCurrentlyEnabled ? 'DISABLED' : 'ENABLED' }
            : item
        )
      )
    } catch (err: any) {
      const isSudoCancelled = err?.message?.includes('cancelled')
      setBannerMessage({
        text:
          err?.response?.data?.message ||
          (isSudoCancelled
            ? `Action cancelled: Sudo elevation is required to ${action} permission '${perm.name}'.`
            : `Failed to ${action} permission '${perm.name}'.`),
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const getDomainFromPermission = (name: string): string => {
    const parts = name.split(':')
    return parts[0] || 'other'
  }

  const getActionFromPermission = (name: string): string => {
    const parts = name.split(':')
    return parts.slice(1).join(':') || 'manage'
  }

  const enabledCount = permissions.filter((p) => p.status === 'ENABLED').length
  const disabledCount = permissions.filter((p) => p.status === 'DISABLED').length

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Permission Governance
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                System-defined granular capabilities across identity, roles, and cryptographic security
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPermissions(currentPage, pageSize)}
            disabled={loading || !canRead}
            className="h-9 gap-2 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Banner feedback */}
      {bannerMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Stats Counter Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Permissions
            </p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {fetchError ? '—' : totalElements}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Page Active (Enabled)
            </p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {fetchError ? '0' : enabledCount}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Page Disabled
            </p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
              {fetchError ? '0' : disabledCount}
            </p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
            <XCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Permissions Table Card with Pagination */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Permissions Directory</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isAdmin
                ? 'Toggle permission status. Modifying states requires sudo elevation.'
                : 'Read-only view of effective system capabilities.'}
            </CardDescription>
          </div>

          {/* Page size selector in header */}
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
        </CardHeader>
        <CardContent className="p-0">
          {fetchError ? (
            <div className="py-14 px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 mb-3 shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {fetchError.status === 403 ? 'Access Restricted' : 'Unable to Retrieve Permissions'}
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {fetchError.message}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {fetchError.status !== 403 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPermissions(currentPage, pageSize)}
                    className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View (visible on tablet and desktop screens) */}
              <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Permission Token</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdmin && <th className="py-3 px-4 sm:px-6 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="py-12 text-center text-zinc-500 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        <span>Loading permissions...</span>
                      </div>
                    </td>
                  </tr>
                ) : permissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 5 : 4}
                      className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs"
                    >
                      No permissions found.
                    </td>
                  </tr>
                ) : (
                  permissions.map((perm) => {
                    const domain = getDomainFromPermission(perm.name)
                    const action = getActionFromPermission(perm.name)
                    const config = DOMAIN_CONFIG[domain] || {
                      label: domain.toUpperCase(),
                      icon: Shield,
                      bg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                      border: 'border-zinc-200 dark:border-zinc-700',
                    }
                    const DomainIcon = config.icon
                    const isBusy = actionLoadingId === perm.id

                    return (
                      <tr
                        key={perm.id || perm.name}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Token & Granular action */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                                {perm.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-mono tracking-tight text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50"
                              >
                                {action}
                              </Badge>
                            </div>
                            {perm.id && (
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                <span>id: {perm.id}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(perm.id)}
                                  title="Copy permission UUID"
                                  className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5 cursor-pointer inline-flex items-center"
                                >
                                  {copiedId === perm.id ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Domain Group */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.bg} ${config.border}`}
                          >
                            <DomainIcon className="h-3 w-3" />
                            <span>{config.label}</span>
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 max-w-md">
                          {perm.description || '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {perm.status === 'ENABLED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                              Disabled
                            </span>
                          )}
                        </td>

                        {/* Admin Action Toggle */}
                        {isAdmin && (
                          <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleToggleStatus(perm)}
                              className={`h-7 text-[11px] px-2.5 cursor-pointer font-medium transition-all ${
                                perm.status === 'ENABLED'
                                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40'
                                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                              }`}
                              title={
                                perm.status === 'ENABLED'
                                  ? 'Disable this permission'
                                  : 'Enable this permission'
                              }
                            >
                              {isBusy ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Power className="h-3 w-3 mr-1" />
                              )}
                              <span>{perm.status === 'ENABLED' ? 'Disable' : 'Enable'}</span>
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (visible on mobile screens, zero horizontal scroll) */}
          <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {loading ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span>Loading permissions...</span>
                </div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                No permissions found.
              </div>
            ) : (
              permissions.map((perm) => {
                const domain = getDomainFromPermission(perm.name)
                const action = getActionFromPermission(perm.name)
                const config = DOMAIN_CONFIG[domain] || {
                  label: domain.toUpperCase(),
                  icon: Shield,
                  bg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                  border: 'border-zinc-200 dark:border-zinc-700',
                }
                const DomainIcon = config.icon
                const isBusy = actionLoadingId === perm.id

                return (
                  <div key={perm.id || perm.name} className="p-4 space-y-2.5">
                    {/* Top Row: Token, Action Badge & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs break-all">
                            {perm.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50"
                          >
                            {action}
                          </Badge>
                        </div>

                        {perm.id && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono break-all">
                            <span>id: {perm.id}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(perm.id)}
                              title="Copy permission UUID"
                              className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5 cursor-pointer shrink-0 inline-flex items-center"
                            >
                              {copiedId === perm.id ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.bg} ${config.border}`}
                        >
                          <DomainIcon className="h-2.5 w-2.5 shrink-0" />
                          <span>{config.label}</span>
                        </span>
                      </div>

                      {/* Status */}
                      <div className="shrink-0">
                        {perm.status === 'ENABLED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Description */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {perm.description || '—'}
                    </p>

                    {/* Bottom: Action Button for Admins */}
                    {isAdmin && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleToggleStatus(perm)}
                          className={`h-8 text-xs w-full cursor-pointer font-medium transition-all ${
                            perm.status === 'ENABLED'
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          ) : (
                            <Power className="h-3 w-3 mr-1.5" />
                          )}
                          <span>{perm.status === 'ENABLED' ? 'Disable Permission' : 'Enable Permission'}</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            </div>
            </>
          )}

          {/* Bottom Pagination Bar */}
          {!fetchError && totalElements > 0 && (
            <div className="p-3.5 sm:px-6 border-t border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-zinc-500 dark:text-zinc-400 text-xs">
                Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{startRecord}</span> to{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{endRecord}</span> of{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalElements}</span> permissions
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
    </div>
  )
}
