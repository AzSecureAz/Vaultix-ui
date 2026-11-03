import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '../api/authApi'
import { useAuthStore } from '@/stores/authStore'

export function EmailRevertPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialToken = searchParams.get('token') || ''
  const [token, setToken] = useState(initialToken)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRevert = async (tokenToUse: string) => {
    const cleanToken = tokenToUse.trim()
    if (!cleanToken) {
      const msg = 'Please provide a valid revert security token.'
      setError(msg)
      toast.error(msg)
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.revertEmail(cleanToken)
      // When email is reverted, backend wipes password and invalidates all sessions.
      // Reset local frontend auth state immediately.
      useAuthStore.setState({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isInitializing: false,
      })
      toast.success('Your email address has been successfully restored.')
      setSuccess(true)
    } catch (err: any) {
      const errData = err?.response?.data
      const msg =
        errData?.message ||
        'Invalid or expired email revert link. The link may have expired or already been used.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Background Subtle Gradient */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(0,0,0,0))]" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/login"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        >
          <Logo className="h-8 w-auto text-zinc-900 dark:text-white" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card Content */}
      <main className="relative z-10 w-full max-w-[460px] sm:max-w-[480px] mx-auto my-auto py-8">
        <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-[#111116] backdrop-blur-xl shadow-2xl shadow-zinc-950/5 dark:shadow-black/50 p-7 sm:p-9 transition-all space-y-6">
          {success ? (
            /* Success State */
            <div className="text-center space-y-5 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                  Email Address Restored!
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  Your Vaultix account has been reverted to your previous email address.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Security Protection Activated</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                  All active sessions across all devices have been terminated. For your protection, your previous password was cleared. Please reset your password to regain access.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={() => {
                    useAuthStore.setState({
                      accessToken: null,
                      refreshToken: null,
                      user: null,
                      isAuthenticated: false,
                      isInitializing: false,
                    })
                    navigate('/forgot-password')
                  }}
                  className="w-full h-11 sm:h-12 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Set New Password Now</span>
                </Button>

                <Link
                  to="/login"
                  className="block text-center text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Confirmation / Action State */
            <div className="space-y-6">
              <div className="text-center space-y-2.5">
                <div className="h-14 w-14 rounded-3xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-sm mb-2">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                  Emergency Email Revert
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto font-medium">
                  Did you not authorize an email change on your Vaultix account? Reverting will immediately restore your address and lock out unauthorized access.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 dark:text-red-300 animate-in fade-in-50 duration-150 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
                <p className="font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-1.5">
                  <RotateCcw className="h-4 w-4 text-red-500" />
                  What happens when you revert:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-400 font-medium">
                  <li>Your previous email address is immediately restored.</li>
                  <li>All active intruder sessions and tokens are terminated.</li>
                  <li>Your password hash is wiped to prevent further unauthorized access.</li>
                </ul>
              </div>

              {!initialToken && (
                <div className="space-y-2">
                  <label
                    htmlFor="revertToken"
                    className="block text-sm font-bold text-zinc-900 dark:text-zinc-100"
                  >
                    Security Revert Token
                  </label>
                  <Input
                    id="revertToken"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter security revert token from email"
                    className="h-11 sm:h-12 rounded-xl text-sm font-mono border-zinc-300 dark:border-zinc-700/80"
                  />
                </div>
              )}

              <Button
                type="button"
                disabled={loading || !token.trim()}
                onClick={() => handleRevert(token)}
                className="w-full h-11 sm:h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Reverting Email Address...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    <span>Revert Email Address Now</span>
                  </>
                )}
              </Button>

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto text-center py-4 text-xs font-medium text-zinc-500">
        &copy; {new Date().getFullYear()} Vaultix Inc. All rights reserved.
      </footer>
    </div>
  )
}
