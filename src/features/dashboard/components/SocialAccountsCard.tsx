import { useState, useEffect, useCallback } from 'react'
import {
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { authApi } from '@/features/auth/api/authApi'
import { GoogleIcon, GoogleSignInButton } from '@/features/auth/components/GoogleSignInButton'
import type { SocialAccountItem } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

export function SocialAccountsCard() {
  const { fetchProfile } = useAuthStore()
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false)

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
    setError(null)
    setSuccess(null)
    setActionLoading('link-google')

    try {
      const res = await authApi.linkGoogleAccount(idToken)
      if (res.success) {
        setSuccess('Google account successfully connected to your profile.')
        setIsLinkingGoogle(false)
        await loadAccounts()
        await fetchProfile()
      } else {
        setError(res.message || 'Failed to link Google account.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      setError(errData?.message || 'Failed to link Google account.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnlink = async (provider: 'GOOGLE' | 'GITHUB') => {
    setError(null)
    setSuccess(null)
    setActionLoading(`unlink-${provider}`)

    try {
      const res = await authApi.unlinkSocialAccount(provider)
      if (res.success) {
        setSuccess(`${provider === 'GOOGLE' ? 'Google' : 'GitHub'} account disconnected successfully.`)
        await loadAccounts()
        await fetchProfile()
      } else {
        setError(res.message || 'Failed to disconnect account.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      setError(
        errData?.message ||
          'Failed to disconnect account. Please ensure you have another sign-in method.'
      )
    } finally {
      setActionLoading(null)
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

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500 mr-2" />
          <span className="text-xs text-zinc-500">Loading connected accounts...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <CardTitle className="text-sm font-semibold">Connected Accounts</CardTitle>
        </div>
        <CardDescription>
          Link your external social identities for single sign-on and instant authentication
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2 animate-in fade-in-50 duration-150">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 animate-in fade-in-50 duration-150">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="flex-1">{success}</span>
          </div>
        )}

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
              ) : isLinkingGoogle ? (
                <div className="flex items-center gap-2">
                  <div className="w-48 sm:w-56">
                    <GoogleSignInButton
                      onSuccess={handleLinkGoogle}
                      onError={(msg) => {
                        setError(msg)
                        setIsLinkingGoogle(false)
                      }}
                      text="continue_with"
                      label="Confirm Google Link"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLinkingGoogle(false)}
                    className="h-8 text-xs px-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLinkingGoogle(true)}
                  disabled={actionLoading === 'link-google'}
                  className="h-8 text-xs px-3 cursor-pointer text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white"
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                  <span>Connect Google</span>
                </Button>
              )}
            </div>
          </div>

          {/* GitHub Account Row (Upcoming) */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="h-5 w-5 fill-current text-zinc-900 dark:text-white" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
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
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4.5 text-zinc-500">
                      Coming Soon
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Developer OAuth2 login and repository access integration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className="h-8 text-xs px-3 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800"
              >
                <span>Coming Soon</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
