import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Link2,
  Unlink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { authApi } from '@/features/auth/api/authApi'
import { GoogleIcon, GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton'
import { GitHubIcon } from '@/features/auth/components/GitHubSignInButton'
import type { SocialAccountItem } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

export function ConnectedAccountsPage() {
  const location = useLocation()
  const { fetchProfile } = useAuthStore()
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage)
      window.history.replaceState({}, document.title)
    }
    if (location.state?.errorMessage) {
      toast.error(location.state.errorMessage)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const loadAccounts = useCallback(async () => {
    try {
      const res = await authApi.getSocialAccounts()
      if (res.success && res.data) {
        setAccounts(res.data)
      }
    } catch (err: any) {
      console.warn('Failed to load linked social accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleLinkGoogle = async (idToken: string) => {
    setActionLoading('link-google')

    try {
      const res = await authApi.linkGoogleAccount(idToken)
      if (res.success) {
        toast.success('Google account successfully connected to your profile.')
        await loadAccounts()
        await fetchProfile()
      } else {
        toast.error(res.message || 'Failed to link Google account.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      toast.error(errData?.message || 'Failed to link Google account.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnlink = async (provider: 'GOOGLE' | 'GITHUB') => {
    setActionLoading(`unlink-${provider}`)

    try {
      const res = await authApi.unlinkSocialAccount(provider)
      if (res.success) {
        toast.success(`${provider === 'GOOGLE' ? 'Google' : 'GitHub'} account disconnected successfully.`)
        await loadAccounts()
        await fetchProfile()
      } else {
        toast.error(res.message || 'Failed to disconnect account.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      toast.error(
        errData?.message ||
          'Failed to disconnect account. Please ensure you have another sign-in method.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  const handleLinkGitHub = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId || clientId === 'YOUR_GITHUB_CLIENT_ID' || clientId === 'your_github_client_id_here' || clientId.trim() === '') {
      toast.error('GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID.')
      return
    }

    setActionLoading('link-github')

    try {
      const state = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
      sessionStorage.setItem('vaultix_github_oauth_state', state)
      sessionStorage.setItem('vaultix_github_oauth_action', 'link')

      const redirectUri = `${window.location.origin}/oauth/callback/github`
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
        clientId
      )}&scope=read:user%20user:email&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${encodeURIComponent(state)}`

      window.location.href = githubUrl
    } catch (err: any) {
      setActionLoading(null)
      toast.error(err?.message || 'Failed to initiate GitHub authentication.')
    }
  }

  const googleAccount = accounts.find((a) => a.provider === 'GOOGLE')
  const githubAccount = accounts.find((a) => a.provider === 'GITHUB')

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-7 sm:space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
          <Link2 className="h-4 w-4" />
          <span>Security &bull; Identity &amp; Single Sign-On</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Connected Accounts
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-medium">
          Link external social identities to enable single sign-on, account recovery, and instant authentication across Vaultix.
        </p>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-[#111116]">
        <CardHeader className="p-6 sm:p-7 pb-4 sm:pb-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-zinc-950 dark:text-white">
              <span>Social &amp; Developer Connections</span>
              {accounts.length > 0 && (
                <Badge variant="default" className="text-xs px-2.5 py-0.5 font-bold font-mono">
                  {accounts.length} {accounts.length === 1 ? 'connected' : 'connected'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              Link your external identity providers to sign in with one click without entering passwords.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4 animate-pulse"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-60" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Account Row */}
              <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
                    <GoogleIcon className="h-6 w-6" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                        Google
                      </h4>
                      {googleAccount ? (
                        <Badge variant="success" dot pulse className="text-xs py-0.5 px-2.5 font-semibold">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs py-0.5 px-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    {googleAccount ? (
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-zinc-950 dark:text-zinc-100 font-semibold">
                          {googleAccount.email || googleAccount.display_name || googleAccount.provider_user_id}
                        </span>
                        {googleAccount.created_at && (
                          <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                            &bull; Linked {formatDate(googleAccount.created_at)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        Sign in with your Google account seamlessly using OpenID Connect authentication.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0 self-end sm:self-center">
                  {googleAccount ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => handleUnlink('GOOGLE')}
                      disabled={actionLoading === 'unlink-GOOGLE'}
                      className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shadow-xs active:scale-95"
                    >
                      {actionLoading === 'unlink-GOOGLE' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Unlink className="h-4 w-4 mr-1.5" />
                      )}
                      <span>Disconnect</span>
                    </Button>
                  ) : (
                    <GoogleSignInButton
                      onSuccess={handleLinkGoogle}
                      onError={(msg) => toast.error(msg)}
                      isLoading={actionLoading === 'link-google'}
                      disabled={actionLoading !== null}
                      label="Connect Google"
                      mode="compact"
                      size="default"
                      className="shrink-0"
                      buttonClassName="h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-xs cursor-pointer active:scale-95"
                    />
                  )}
                </div>
              </div>

              {/* GitHub Account Row */}
              <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
                    <GitHubIcon className="h-6 w-6 text-zinc-950 dark:text-white" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                        GitHub
                      </h4>
                      {githubAccount ? (
                        <Badge variant="success" dot pulse className="text-xs py-0.5 px-2.5 font-semibold">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs py-0.5 px-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    {githubAccount ? (
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 font-medium truncate flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-zinc-950 dark:text-zinc-100 font-semibold">
                          {githubAccount.email || githubAccount.display_name || githubAccount.provider_user_id}
                        </span>
                        {githubAccount.created_at && (
                          <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                            &bull; Linked {formatDate(githubAccount.created_at)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        Sign in and synchronize developer identities with GitHub OAuth2 verification.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0 self-end sm:self-center">
                  {githubAccount ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => handleUnlink('GITHUB')}
                      disabled={actionLoading === 'unlink-GITHUB'}
                      className="h-10 px-4 text-xs sm:text-sm font-bold rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shadow-xs active:scale-95"
                    >
                      {actionLoading === 'unlink-GITHUB' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Unlink className="h-4 w-4 mr-1.5" />
                      )}
                      <span>Disconnect</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={handleLinkGitHub}
                      disabled={actionLoading !== null}
                      className="h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 shadow-xs cursor-pointer active:scale-95"
                    >
                      {actionLoading === 'link-github' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Link2 className="h-4 w-4 mr-2 text-zinc-500" />
                      )}
                      <span>Connect GitHub</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
