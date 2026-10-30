import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Link2,
  Unlink,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
          <Link2 className="h-4 w-4" />
          <span>Security &bull; Identity</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Connected Accounts
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Link external social identities to enable single sign-on and instant authentication across Vaultix.
        </p>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span>Social Connections</span>
              {accounts.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Link your external accounts to sign in with one click without entering a password
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              <span>Loading connected accounts...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Google Account Row */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-xs">
                    <GoogleIcon className="h-5 w-5" />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Google
                      </h4>
                      {googleAccount ? (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4.5">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4.5">
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    {googleAccount ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {googleAccount.email || googleAccount.display_name || googleAccount.provider_user_id}
                        {googleAccount.created_at && (
                          <span className="text-zinc-400 dark:text-zinc-500 text-[11px] ml-1.5">
                            &bull; Linked {formatDate(googleAccount.created_at)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Sign in with your Google account seamlessly using OpenID Connect
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800/60">
                  {googleAccount ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlink('GOOGLE')}
                      disabled={actionLoading === 'unlink-GOOGLE'}
                      className="h-8 text-xs px-3 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/60 dark:hover:bg-red-950/20 border-red-200/60 dark:border-red-900/40"
                    >
                      {actionLoading === 'unlink-GOOGLE' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5 mr-1.5" />
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
                    />
                  )}
                </div>
              </div>

              {/* GitHub Account Row */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-xs">
                    <GitHubIcon className="h-5 w-5 text-zinc-900 dark:text-white" />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        GitHub
                      </h4>
                      {githubAccount ? (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4.5">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4.5">
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    {githubAccount ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {githubAccount.email || githubAccount.display_name || githubAccount.provider_user_id}
                        {githubAccount.created_at && (
                          <span className="text-zinc-400 dark:text-zinc-500 text-[11px] ml-1.5">
                            &bull; Linked {formatDate(githubAccount.created_at)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Sign in and synchronize developer identities with GitHub OAuth2
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800/60">
                  {githubAccount ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlink('GITHUB')}
                      disabled={actionLoading === 'unlink-GITHUB'}
                      className="h-8 text-xs px-3 cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/60 dark:hover:bg-red-950/20 border-red-200/60 dark:border-red-900/40"
                    >
                      {actionLoading === 'unlink-GITHUB' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      <span>Disconnect</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLinkGitHub}
                      disabled={actionLoading !== null}
                      className="h-8 text-xs px-3 cursor-pointer text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white"
                    >
                      {actionLoading === 'link-github' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
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
