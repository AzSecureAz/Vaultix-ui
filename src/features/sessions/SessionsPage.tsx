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
    return <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
  }
  return <Laptop className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
    <div className="space-y-7 sm:space-y-8 max-w-5xl mx-auto pb-16 w-full min-w-0 overflow-x-hidden sm:overflow-visible">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            <Smartphone className="h-4 w-4" />
            <span>Security &bull; Active Sessions &amp; Device Ingress</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
            <span className="truncate">Active Sessions &amp; Devices</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-medium">
            Inspect, monitor, and revoke authenticated refresh tokens and active client device sessions resolved by GeoIP.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="default"
            onClick={refreshAll}
            disabled={isRefreshing}
            className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-xs cursor-pointer active:scale-95"
            title="Refresh session list"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => setIsLogoutOtherOpen(true)}
            disabled={otherSessions.length === 0 && totalOtherSessions === 0}
            className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Smartphone className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            <span>Sign out others</span>
          </Button>

          <Button
            variant="destructive"
            size="default"
            onClick={() => setIsLogoutAllOpen(true)}
            className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-red-300 dark:border-red-800 bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer active:scale-95"
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            <span>Sign out all</span>
          </Button>
        </div>
      </div>

      {/* Current Device Card */}
      <Card className="border border-blue-500/30 dark:border-blue-500/25 bg-gradient-to-br from-blue-500/[0.04] via-indigo-500/[0.02] to-transparent rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 sm:p-7 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                {getDeviceIcon(currentSession?.device_info)}
              </div>
              <div className="min-w-0 space-y-0.5">
                <CardTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2.5 flex-wrap">
                  <span>Current Active Session</span>
                  <Badge variant="success" dot pulse className="text-xs py-0.5 px-2.5 font-semibold">
                    This Device
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate">
                  {currentSession?.device_info || 'Authenticated Client'}
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="default"
              onClick={handleLogoutCurrent}
              className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 self-start sm:self-auto cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-7 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 min-w-0 overflow-hidden shadow-2xs">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              Ingress &amp; GeoIP
            </span>
            <p className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white break-words">
              {isLoadingCurrent ? 'Loading...' : currentSession?.location_info || 'Localhost / Unknown'}
            </p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono font-medium break-all">
              {isLoadingCurrent ? '...' : currentSession?.ip_address || '127.0.0.1'}
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 min-w-0 overflow-hidden shadow-2xs">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              Client Context
            </span>
            <p className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white truncate">
              {isLoadingCurrent ? 'Loading...' : currentSession?.device_info || 'Web Browser'}
            </p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              Last active: {formatDateTime(currentSession?.last_active_at)}
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 min-w-0 overflow-hidden shadow-2xs">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              Token Lifetime
            </span>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>Automatic Rotation Active</span>
            </p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-mono truncate" title={currentSession?.id || ''}>
              Session ID: {currentSession ? `${currentSession.id.slice(0, 16)}...` : 'active-session'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Other Active Sessions Card */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-[#111116]">
        <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2.5">
              <span>Other Active Devices &amp; Sessions</span>
              <Badge variant="default" className="text-xs px-2.5 py-0.5 font-bold font-mono">
                {totalOtherSessions}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              External devices currently authenticated with unexpired refresh tokens
            </CardDescription>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Rows:
            </span>
            <div className="inline-flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 p-1 bg-zinc-50 dark:bg-zinc-900/80">
              {[10, 20, 50].map((sizeOption) => (
                <button
                  key={sizeOption}
                  type="button"
                  onClick={() => handlePageSizeChange(sizeOption)}
                  className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pageSize === sizeOption
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
                  }`}
                >
                  {sizeOption}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-4">
          {isLoadingOther ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-5 w-44 sm:w-60" />
                      <Skeleton className="h-4 w-52 sm:w-80" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : otherSessions.length === 0 ? (
            <div className="py-12 px-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3">
              <div className="inline-flex h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center border border-emerald-500/20 shadow-2xs">
                <ShieldCheck className="h-6 w-6 stroke-[2]" />
              </div>
              <p className="text-base font-bold text-zinc-950 dark:text-white">
                No other active sessions
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium max-w-sm mx-auto">
                Your account is currently signed in on this device only. Additional sessions will appear here when authenticated.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {otherSessions.map((session) => {
                const isRevoking = revokingSessionId === session.id
                return (
                  <div
                    key={session.id}
                    className="p-5 sm:p-6 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 shadow-2xs min-w-0 overflow-hidden"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        {getDeviceIcon(session.device_info)}
                      </div>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <p className="text-base font-bold text-zinc-950 dark:text-white truncate">
                          {session.device_info || 'Unknown Device'}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate">{session.location_info || 'Unknown Location'}</span>
                          </span>
                          <span>&bull;</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">
                            {session.ip_address}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span>Last active: {formatDateTime(session.last_active_at || session.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setSessionToRevoke(session)}
                        disabled={isRevoking}
                        className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shadow-xs active:scale-95"
                      >
                        {isRevoking ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1.5" />
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
          <div className="p-4 sm:px-8 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="text-zinc-600 dark:text-zinc-400 font-medium">
              Showing <span className="font-bold text-zinc-950 dark:text-white">{startRecord}</span> to{' '}
              <span className="font-bold text-zinc-950 dark:text-white">{endRecord}</span> of{' '}
              <span className="font-bold text-zinc-950 dark:text-white">{totalOtherSessions}</span> sessions
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-medium mr-1">
                Page {currentPage + 1} of {Math.max(1, totalPages)}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={isFirst || isLoadingOther}
                  className="h-9 px-3 text-xs font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={isLast || isLoadingOther}
                  className="h-9 px-3 text-xs font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog for Revoking Individual Session */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 text-zinc-950 dark:text-zinc-50 animate-in zoom-in-95 duration-200">
            <div className="space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20 shadow-xs">
                <Trash2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Revoke Session Access?
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                Are you sure you want to sign out this client device? All active refresh tokens will be immediately invalidated.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm space-y-1.5">
              <p className="font-bold text-zinc-950 dark:text-white">
                {sessionToRevoke.device_info || 'Unknown Device'}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium">
                {sessionToRevoke.location_info || 'Localhost'} &bull; <span className="font-mono">{sessionToRevoke.ip_address}</span>
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setSessionToRevoke(null)}
                className="h-11 sm:h-12 px-5 text-sm sm:text-base font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="default"
                onClick={() => handleRevokeSingle(sessionToRevoke)}
                disabled={revokingSessionId === sessionToRevoke.id}
                className="h-11 sm:h-12 px-6 text-sm sm:text-base font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer active:scale-95 transition-all"
              >
                {revokingSessionId === sessionToRevoke.id ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Revoking...</span>
                  </span>
                ) : (
                  <span>Revoke Session</span>
                )}
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
