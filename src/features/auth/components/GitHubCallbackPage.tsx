import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
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
  const [action, setAction] = useState<'login' | 'link' | 'sudo'>('login')

  useEffect(() => {
    const processOAuthCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const oauthError = searchParams.get('error')
      const oauthErrorDesc = searchParams.get('error_description')

      const storedAction = (sessionStorage.getItem('vaultix_github_oauth_action') as 'login' | 'link' | 'sudo') || 'login'
      setAction(storedAction)

      const storedState = sessionStorage.getItem('vaultix_github_oauth_state')
      sessionStorage.removeItem('vaultix_github_oauth_state')
      sessionStorage.removeItem('vaultix_github_oauth_action')

      if (oauthError) {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'VAULTIX_GITHUB_SUDO_CALLBACK', error: oauthErrorDesc || oauthError },
            window.location.origin
          )
          window.close()
          return
        }
        setLoading(false)
        const msg = oauthErrorDesc || 'GitHub authorization was denied or canceled.'
        setError(msg)
        toast.error(msg)
        return
      }

      if (!code) {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'VAULTIX_GITHUB_SUDO_CALLBACK', error: 'Missing authorization code from GitHub callback.' },
            window.location.origin
          )
          window.close()
          return
        }
        setLoading(false)
        const msg = 'Missing authorization code from GitHub callback.'
        setError(msg)
        toast.error(msg)
        return
      }

      if (storedState && state && storedState !== state) {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'VAULTIX_GITHUB_SUDO_CALLBACK', error: 'Security check failed: OAuth state mismatch.' },
            window.location.origin
          )
          window.close()
          return
        }
        setLoading(false)
        const msg = 'Security check failed: OAuth state mismatch. Please try again.'
        setError(msg)
        toast.error(msg)
        return
      }

      if (storedAction === 'sudo') {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'VAULTIX_GITHUB_SUDO_CALLBACK', code, state },
            window.location.origin
          )
          window.close()
          return
        }
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
            const msg = res.message || 'Failed to link GitHub account.'
            setError(msg)
            toast.error(msg)
          }
        } else {
          const res = await authApi.loginWithGitHub(code, redirectUri)
          if (res.success && res.data) {
            if (res.data.mfa_required && res.data.mfa_token) {
              toast.info('Two-factor authentication challenge required.')
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
              toast.success('Signed in with GitHub successfully.')
              navigate('/dashboard', { replace: true })
            }
          } else {
            setLoading(false)
            const msg = res.message || 'Authentication with GitHub failed.'
            setError(msg)
            toast.error(msg)
          }
        }
      } catch (err: any) {
        setLoading(false)
        const errData = err?.response?.data
        const msg =
          errData?.message ||
          errData?.error ||
          'Failed to complete GitHub authentication. Please try again.'
        setError(msg)
        toast.error(msg)
      }
    }

    processOAuthCallback()
  }, [searchParams, navigate, setAuth])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090a0f] bg-grid-pattern flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-[460px] z-10 px-4 sm:px-0">
        <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#111116] backdrop-blur-xl shadow-2xl shadow-zinc-950/5 dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-all p-8 sm:p-9 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto shadow-md">
            <GitHubIcon className="h-7 w-7 text-white dark:text-zinc-950" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              {action === 'link' ? 'Connecting GitHub Account' : 'Authenticating with GitHub'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              {loading
                ? 'Exchanging secure authorization credentials with GitHub servers...'
                : error
                ? 'Could not complete GitHub authentication'
                : 'Authentication complete, redirecting...'}
            </p>
          </div>

          <div className="mt-4">
            {loading && (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Verifying secure OAuth credentials...</span>
              </div>
            )}

            {error && (
              <div className="space-y-4 text-left">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-red-700 dark:text-red-300">Authentication Error</p>
                    <p className="leading-relaxed">{error}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(action === 'link' ? '/connected-accounts' : '/login', { replace: true })}
                    className="w-full h-11 text-sm font-bold rounded-xl border-zinc-300 dark:border-zinc-700 cursor-pointer active:scale-95"
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
