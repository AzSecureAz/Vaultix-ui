import { useState, useEffect, useCallback } from 'react'
import {
  Smartphone,
  Globe,
  Clock,
  ShieldAlert,
  LogOut,
  MapPin,
  Laptop,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api-client'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LogoutAllModal } from '@/components/ui/LogoutAllModal'
import { LogoutOtherModal } from '@/components/ui/LogoutOtherModal'
import { sessionsApi, type SessionItem } from './api/sessionsApi'

function getDeviceIcon(deviceInfo?: string) {
  const info = (deviceInfo || '').toLowerCase()
  if (info.includes('mobile') || info.includes('android') || info.includes('iphone') || info.includes('ipad')) {
    return <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
  }
  return <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-400" />
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'Unknown'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export function SessionsPage() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  /* URL-driven pagination: 1-indexed for users in URL (?page=1, ?size=10) */
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawSize = parseInt(searchParams.get('size') || '10', 10)
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 0 : rawPage - 1
  const pageSize = [10, 20, 50].includes(rawSize) ? rawSize : 10

  /* Session state */
  const [currentSession, setCurrentSession] = useState<SessionItem | null>(null)
  const [otherSessions, setOtherSessions] = useState<SessionItem[]>([])
  const [totalOtherSessions, setTotalOtherSessions] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isFirst, setIsFirst] = useState(true)
  const [isLast, setIsLast] = useState(true)

  /* Loading & action state */
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true)
  const [isLoadingOther, setIsLoadingOther] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false)
  const [isLogoutOtherOpen, setIsLogoutOtherOpen] = useState(false)
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionItem | null>(null)

  const fetchCurrentSession = useCallback(async () => {
    try {
      setIsLoadingCurrent(true)
      const res = await sessionsApi.getCurrentSession()
      if (res.success && res.data) {
        setCurrentSession(res.data)
      }
    } catch {
      /* Handled gracefully */
    } finally {
      setIsLoadingCurrent(false)
    }
  }, [])

  const fetchOtherSessions = useCallback(
    async (page: number, size: number) => {
      try {
        setIsLoadingOther(true)
        const res = await sessionsApi.getOtherSessions(page, size)
        if (res.success && res.data) {
          const items = res.data.content || []
          const pageInfo = res.data.page
          const total = pageInfo?.total_elements ?? res.data.total_elements ?? res.data.totalElements ?? items.length
          const pages = pageInfo?.total_pages ?? res.data.total_pages ?? res.data.totalPages ?? Math.max(1, Math.ceil(total / size))
          const pageNum = pageInfo?.number ?? res.data.number ?? page

          setOtherSessions(items)
          setTotalOtherSessions(total)
          setTotalPages(pages)
          setIsFirst(pageNum === 0)
          setIsLast(pageNum >= pages - 1)

          /* Auto-correct page if query param exceeds total pages */
          if (page >= pages && pages > 0) {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.set('page', String(pages))
              return next
            })
          }
        }
      } catch {
        setOtherSessions([])
        setTotalOtherSessions(0)
        setTotalPages(1)
        setIsFirst(true)
        setIsLast(true)
      } finally {
        setIsLoadingOther(false)
      }
    },
    [setSearchParams]
  )

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchCurrentSession(), fetchOtherSessions(currentPage, pageSize)])
      toast.success('Active sessions refreshed.')
    } catch {
      toast.error('Failed to refresh active sessions.')
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchCurrentSession, fetchOtherSessions, currentPage, pageSize])

  useEffect(() => {
    fetchCurrentSession()
  }, [fetchCurrentSession])

  useEffect(() => {
    fetchOtherSessions(currentPage, pageSize)
  }, [fetchOtherSessions, currentPage, pageSize])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && !isLoadingOther) {
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

  const handleLogoutCurrent = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      /* Handled gracefully on logout */
    } finally {
      logout()
      navigate('/login')
    }
  }

  const handleRevokeSingle = async (session: SessionItem) => {
    setRevokingSessionId(session.id)
    try {
      const res = await sessionsApi.revokeSession(session.id)
      if (res.success) {
        toast.success(`Session on ${session.device_info || 'device'} revoked successfully.`)
        setSessionToRevoke(null)
        await fetchOtherSessions(currentPage, pageSize)
      } else {
        toast.error(res.message || 'Failed to revoke session.')
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } }
      toast.error(errorObj?.response?.data?.message || 'An error occurred while revoking the session.')
    } finally {
      setRevokingSessionId(null)
    }
  }

  const startRecord = totalOtherSessions === 0 ? 0 : currentPage * pageSize + 1
  const endRecord = Math.min((currentPage + 1) * pageSize, totalOtherSessions)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 w-full min-w-0 overflow-x-hidden sm:overflow-visible">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Active Sessions &amp; Device Ingress</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track and revoke active refresh tokens and device sessions validated by GeoIP
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="h-8 sm:h-9 gap-1.5 sm:gap-2 text-xs font-medium cursor-pointer"
            title="Refresh session list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogoutOtherOpen(true)}
            disabled={otherSessions.length === 0 && totalOtherSessions === 0}
            className="h-8 sm:h-9 gap-1.5 sm:gap-2 text-xs font-medium cursor-pointer"
          >
            <Smartphone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sign out other devices</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsLogoutAllOpen(true)}
            className="h-8 sm:h-9 gap-1.5 sm:gap-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Sign out everywhere</span>
          </Button>
        </div>
      </div>

      {/* Current Device Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                {getDeviceIcon(currentSession?.device_info)}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base text-zinc-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Current Active Session</span>
                  <Badge variant="success" dot pulse className="text-[10px]">This Device</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {currentSession?.device_info || 'Authenticated Client'}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutCurrent}
              className="text-xs gap-1.5 border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1 min-w-0 overflow-hidden">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              Ingress &amp; GeoIP
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white break-words">
              {isLoadingCurrent ? 'Loading...' : currentSession?.location_info || 'Localhost / Unknown'}
            </p>
            <p className="text-xs text-zinc-500 font-mono break-all">
              {isLoadingCurrent ? '...' : currentSession?.ip_address || '127.0.0.1'}
            </p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1 min-w-0 overflow-hidden">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              Client Context
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {isLoadingCurrent ? 'Loading...' : currentSession?.device_info || 'Web Browser'}
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Last active: {formatDateTime(currentSession?.last_active_at)}
            </p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1 min-w-0 overflow-hidden">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              Token Lifetime
            </span>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Automatic Rotation</p>
            <p className="text-xs text-zinc-500 truncate" title={currentSession?.id || ''}>
              Session ID: {currentSession ? `${currentSession.id.slice(0, 16)}...` : 'active-session'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Other Active Sessions Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="min-w-0">
            <CardTitle className="text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <span>Other Active Devices &amp; Sessions</span>
              <Badge variant="outline" className="text-xs font-mono">
                {totalOtherSessions}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Devices currently signed in with unexpired refresh tokens
            </CardDescription>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2 shrink-0">
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
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {sizeOption}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {isLoadingOther ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-4 w-40 sm:w-56" />
                      <Skeleton className="h-3 w-48 sm:w-80" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-18 rounded-lg shrink-0" />
                </div>
              ))}
            </div>
          ) : otherSessions.length === 0 ? (
            <div className="py-10 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2">
              <div className="inline-flex h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                No other active sessions
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Your account is currently signed in on this device only. Other sessions will appear here when authenticated.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {otherSessions.map((session) => {
                const isRevoking = revokingSessionId === session.id
                return (
                  <div
                    key={session.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700 min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                        {getDeviceIcon(session.device_info)}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {session.device_info || 'Unknown Device'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                            <span className="truncate">{session.location_info || 'Unknown Location'}</span>
                          </span>
                          <span className="font-mono text-[11px] text-zinc-400">
                            {session.ip_address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span>Last active: {formatDateTime(session.last_active_at || session.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionToRevoke(session)}
                        disabled={isRevoking}
                        className="text-xs h-8 gap-1.5 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      >
                        {isRevoking ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span>{isRevoking ? 'Revoking...' : 'Revoke'}</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>

        {/* Bottom Pagination Bar */}
        {totalOtherSessions > 0 && (
          <div className="p-3.5 sm:px-6 border-t border-zinc-200/90 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-zinc-500 dark:text-zinc-400 text-xs">
              Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{startRecord}</span> to{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{endRecord}</span> of{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalOtherSessions}</span> sessions
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
                  disabled={isFirst || isLoadingOther}
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
                  disabled={isLast || isLoadingOther}
                  className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog for Revoking Individual Session */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Revoke Session</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to sign out this device?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
              <p className="font-semibold text-zinc-900 dark:text-white">
                {sessionToRevoke.device_info || 'Unknown Device'}
              </p>
              <p className="text-zinc-500">
                {sessionToRevoke.location_info || 'Localhost'} &bull; {sessionToRevoke.ip_address}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionToRevoke(null)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevokeSingle(sessionToRevoke)}
                disabled={revokingSessionId === sessionToRevoke.id}
                className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {revokingSessionId === sessionToRevoke.id && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                <span>Revoke Session</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Sign out other devices */}
      <LogoutOtherModal
        isOpen={isLogoutOtherOpen}
        onClose={() => setIsLogoutOtherOpen(false)}
        onSuccess={() => {
          toast.success('Signed out of all other devices successfully.')
          fetchOtherSessions(0, pageSize)
        }}
      />

      {/* Confirmation Modal for Sign out everywhere */}
      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
      />
    </div>
  )
}
