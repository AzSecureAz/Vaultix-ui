import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
      setError('Please provide a valid revert security token.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      await authApi.revertEmail(cleanToken)
      setSuccess(true)
    } catch (err: any) {
      const errData = err?.response?.data
      setError(
        errData?.message ||
          'Invalid or expired email revert link. The link may have expired or already been used.'
      )
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
      <main className="relative z-10 w-full max-w-[440px] mx-auto my-auto py-8">
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-zinc-950/5 dark:shadow-black/40 p-6 sm:p-8 transition-all">
          {success ? (
            /* Success State */
            <div className="text-center space-y-5 animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Email Address Restored!
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Your Vaultix account has been reverted to your previous email address.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Security Protection Activated</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  All active sessions across all devices have been terminated. For your protection, your previous password was cleared. Please reset your password to regain access.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Set New Password Now</span>
                </Button>

                <Link
                  to="/login"
                  className="block text-center text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Confirmation / Action State */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-500/20 shadow-sm mb-3">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Emergency Email Revert
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Did you not authorize an email change on your Vaultix account? Reverting will immediately restore your address and lock out unauthorized access.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in-50 duration-150">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 space-y-2">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-red-500" />
                  What happens when you revert:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-500 dark:text-zinc-400">
                  <li>Your previous email address is immediately restored.</li>
                  <li>All active intruder sessions and tokens are terminated.</li>
                  <li>Your password hash is wiped to prevent further unauthorized access.</li>
                </ul>
              </div>

              {!initialToken && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="revertToken"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Security Revert Token
                  </label>
                  <Input
                    id="revertToken"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter security revert token from email"
                    className="h-11 rounded-xl text-xs font-mono"
                  />
                </div>
              )}

              <Button
                type="button"
                disabled={loading || !token.trim()}
                onClick={() => handleRevert(token)}
                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto text-center py-4 text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} Vaultix Inc. All rights reserved.
      </footer>
    </div>
  )
}
