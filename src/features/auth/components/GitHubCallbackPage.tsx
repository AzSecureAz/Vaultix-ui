import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '../api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { GitHubIcon } from './GitHubSignInButton'

export function GitHubCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'login' | 'link'>('login')

  useEffect(() => {
    const processOAuthCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')
      const oauthErrorDesc = searchParams.get('error_description')

      const storedAction = (sessionStorage.getItem('vaultix_github_oauth_action') as 'login' | 'link') || 'login'
      setAction(storedAction)

      const storedState = sessionStorage.getItem('vaultix_github_oauth_state')
      sessionStorage.removeItem('vaultix_github_oauth_state')
      sessionStorage.removeItem('vaultix_github_oauth_action')

      if (oauthError) {
        setLoading(false)
        setError(oauthErrorDesc || 'GitHub authorization was denied or canceled.')
        return
      }

      if (!code) {
        setLoading(false)
        setError('Missing authorization code from GitHub callback.')
        return
      }

      if (storedState && state && storedState !== state) {
        setLoading(false)
        setError('Security check failed: OAuth state mismatch. Please try again.')
        return
      }

      const redirectUri = `${window.location.origin}/oauth/callback/github`

      try {
        if (storedAction === 'link') {
          const res = await authApi.linkGitHubAccount(code, redirectUri)
          if (res.success) {
            navigate('/connected-accounts', {
              replace: true,
              state: { successMessage: 'GitHub account linked successfully.' },
            })
          } else {
            setLoading(false)
            setError(res.message || 'Failed to link GitHub account.')
          }
        } else {
          const res = await authApi.loginWithGitHub(code, redirectUri)
          if (res.success && res.data) {
            if (res.data.mfa_required && res.data.mfa_token) {
              navigate('/login', {
                replace: true,
                state: {
                  mfaChallenge: {
                    mfaToken: res.data.mfa_token,
                    hasRecoveryCodes: res.data.has_recovery_codes,
                    totpEnabled: res.data.totp_enabled,
                    smsMfaEnabled: res.data.sms_mfa_enabled,
                    maskedPhoneNumber: res.data.masked_phone_number,
                  },
                },
              })
            } else {
              await setAuth(res.data)
              navigate('/dashboard', { replace: true })
            }
          } else {
            setLoading(false)
            setError(res.message || 'Authentication with GitHub failed.')
          }
        }
      } catch (err: any) {
        setLoading(false)
        const errData = err?.response?.data
        setError(
          errData?.message ||
            errData?.error ||
            'Failed to complete GitHub authentication. Please try again.'
        )
      }
    }

    processOAuthCallback()
  }, [searchParams, navigate, setAuth])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090a0f] bg-grid-pattern flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-zinc-950/5 dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-all p-7 text-center">
          <div className="h-11 w-11 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <GitHubIcon className="h-6 w-6 text-white dark:text-zinc-950" />
          </div>

          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {action === 'link' ? 'Connecting GitHub Account' : 'Authenticating with GitHub'}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {loading
              ? 'Exchanging secure authorization credentials with GitHub servers...'
              : error
              ? 'Could not complete GitHub authentication'
              : 'Authentication complete, redirecting...'}
          </p>

          <div className="mt-6">
            {loading && (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600 dark:text-zinc-400" />
                <span className="text-xs text-zinc-500">Verifying identity...</span>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2.5 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Authentication Error</p>
                    <p className="leading-relaxed">{error}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(action === 'link' ? '/connected-accounts' : '/login', { replace: true })}
                    className="w-full h-10 text-xs sm:text-sm font-medium rounded-lg border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span>Return to {action === 'link' ? 'Connected Accounts' : 'Login'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
