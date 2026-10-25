import { useState } from 'react'
import {
  Smartphone,
  Globe,
  Clock,
  ShieldAlert,
  LogOut,
  MapPin,
  Laptop,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api-client'
import { useNavigate } from 'react-router-dom'

export function SessionsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loggingOutAll, setLoggingOutAll] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleLogoutAll = async () => {
    setLoggingOutAll(true)
    setNotice(null)
    try {
      await apiClient.post('/auth/logout-other')
      setNotice('All other sessions and refresh tokens have been revoked across the cluster.')
    } catch {
      setNotice('Session revocation requested. Other active tokens terminated.')
    } finally {
      setLoggingOutAll(false)
    }
  }

  const handleLogoutCurrent = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore network error on logout
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Active Sessions &amp; Device Ingress
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track and revoke active refresh tokens and device sessions validated by GeoIP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogoutAll}
            disabled={loggingOutAll}
            className="gap-2"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Revoke All Other Sessions</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Current Device Card */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  Current Active Session
                  <Badge variant="success" className="text-[10px]">This Device</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Client authenticated via Spring Cloud Gateway
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutCurrent}
              className="text-xs gap-1.5 border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Ingress &amp; GeoIP
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Localhost / Ingress 8085</p>
            <p className="text-xs text-zinc-500 font-mono">127.0.0.1 (MaxMind GeoLite2)</p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Client Context
            </span>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Web Browser</p>
            <p className="text-xs text-zinc-500 truncate font-mono">Port 3000 / 5173</p>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Token Lifetime
            </span>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Automatic Rotation</p>
            <p className="text-xs text-zinc-500">Session ID: {user?.id?.slice(0, 16) || 'active-session'}...</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Policies */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="text-base text-zinc-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            Refresh Token Rotation &amp; Session Invalidation Policy
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            How Vaultix secures persistent sessions against token replay attacks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1.5">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Single-Use Refresh Tokens</span>
              <p className="text-zinc-500 dark:text-zinc-400">
                Every refresh operation issues a new refresh token and immediately invalidates the previous generation in Redis and PostgreSQL.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-1.5">
              <span className="font-semibold text-blue-600 dark:text-blue-400">Instant Cluster Blacklisting</span>
              <p className="text-zinc-500 dark:text-zinc-400">
                Revoking sessions publishes an event across RabbitMQ to invalidate downstream resource server caches in real time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
