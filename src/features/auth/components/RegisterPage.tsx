import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Check,
  Shield,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '../api/authApi'
import { GoogleSignInButton } from './GoogleSignInButton'
import { GitHubSignInButton } from './GitHubSignInButton'

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSuccess, setIsSuccess] = useState(false)

  // Password rules validation
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0
  const isUsernameValid = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,126}[a-zA-Z0-9]$/.test(username) || username.length >= 3

  const isFormValid =
    isUsernameValid &&
    email.trim().length >= 5 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    hasSpecial &&
    passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!isFormValid) {
      const errors: Record<string, string> = {}
      if (!isUsernameValid) {
        errors.username = 'Username must be 3-128 chars, lowercase letters, numbers, dots or hyphens'
      }
      if (email.trim().length < 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Please provide a valid email address'
      }
      if (!hasMinLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        errors.password = 'Password does not satisfy all complexity requirements'
      }
      if (!passwordsMatch) {
        errors.confirmPassword = 'Passwords do not match'
      }
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const response = await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
      })

      if (response.success) {
        setIsSuccess(true)
      } else {
        setError(response.message || 'Registration failed')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      if (errData?.errors && typeof errData.errors === 'object' && Object.keys(errData.errors).length > 0) {
        const mappedErrors: Record<string, string> = {}
        for (const [key, msg] of Object.entries(errData.errors)) {
          if (typeof msg === 'string') {
            if (key === 'full_name' || key === 'fullName') mappedErrors.fullName = msg
            else if (key === 'phone_number' || key === 'phoneNumber') mappedErrors.phoneNumber = msg
            else mappedErrors[key] = msg
          }
        }
        setFieldErrors(mappedErrors)
        const unhandled = Object.entries(errData.errors).filter(
          ([key]) => !['username', 'email', 'password', 'confirmPassword', 'fullName', 'full_name', 'phoneNumber', 'phone_number'].includes(key)
        )
        if (unhandled.length > 0) {
          setError(unhandled.map(([, val]) => val).join('. '))
        }
      } else {
        setError(
          errData?.message ||
            errData?.error ||
            'Registration could not be completed. Please check your details.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async (idToken: string) => {
    setError(null)
    setFieldErrors({})
    setGoogleLoading(true)

    try {
      const response = await authApi.loginWithGoogle(idToken)

      if (response.success && response.data) {
        if (response.data.mfa_required) {
          navigate('/login')
        } else {
          await setAuth(response.data)
          navigate('/dashboard')
        }
      } else {
        setError(response.message || 'Google registration failed.')
      }
    } catch (err: any) {
      const errData = err?.response?.data
      setError(
        errData?.message ||
          errData?.error ||
          'Failed to sign up with Google.'
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] bg-grid-pattern text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pt-2">
        <Logo size="sm" subtitle="IAM" />
        <ThemeToggle variant="segmented" />
      </header>

      {/* Clerk-Style Center Auth Card */}
      <main className="my-auto w-full max-w-[420px] mx-auto py-6">
        <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-zinc-950/5 dark:shadow-2xl dark:shadow-black/60 overflow-hidden transition-all">
          {/* Card Header with Centered Emblem */}
          <div className="p-7 pb-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Create your account
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Welcome! Please fill in the details to get started.
            </p>
          </div>

          {/* Card Body */}
          <div className="px-7 pb-7">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isSuccess ? (
              <div className="space-y-4">
                {/* Google Sign Up */}
                <GoogleSignInButton
                  onSuccess={handleGoogleSignUp}
                  onError={(msg) => setError(msg)}
                  disabled={googleLoading || loading}
                  isLoading={googleLoading}
                  text="signup_with"
                />

                {/* GitHub Sign Up */}
                <GitHubSignInButton
                  action="login"
                  text="signup_with"
                  onError={(msg) => setError(msg)}
                  disabled={googleLoading || loading}
                />

                {/* Divider */}
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 text-[10px] font-medium tracking-wider">
                      or register with details
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Username
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.username
                          return next
                        })
                      }
                    }}
                    autoComplete="username"
                    autoFocus
                    className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                      fieldErrors.username
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  {fieldErrors.username ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.username}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      3-128 chars, lowercase letters, numbers, dots, hyphens
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email address
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.email
                          return next
                        })
                      }
                    }}
                    autoComplete="email"
                    className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                      fieldErrors.email
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full name <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (fieldErrors.fullName) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.fullName
                          return next
                        })
                      }
                    }}
                    autoComplete="name"
                    className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                      fieldErrors.fullName
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.fullName}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Phone number <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <PhoneInput
                    value={phoneNumber}
                    onChange={(val) => {
                      setPhoneNumber(val)
                      if (fieldErrors.phoneNumber) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.phoneNumber
                          return next
                        })
                      }
                    }}
                    hasError={!!fieldErrors.phoneNumber}
                    placeholder="98765 43210"
                  />
                  {fieldErrors.phoneNumber ? (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.phoneNumber}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      Select country dial code & enter phone number
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => {
                            const next = { ...prev }
                            delete next.password
                            return next
                          })
                        }
                      }}
                      className={`h-10 pr-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                        fieldErrors.password
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Confirm password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => {
                          const next = { ...prev }
                          delete next.confirmPassword
                          return next
                        })
                      }
                    }}
                    className={`h-10 text-xs sm:text-sm rounded-lg bg-zinc-50/50 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1 animate-in fade-in-50 duration-150">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{fieldErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/70 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-1">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-1 text-zinc-400 dark:text-zinc-500">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Min 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Numeric digit
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Special symbol
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}`}>
                      <Check className="h-3 w-3" /> Passwords match
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full mt-2 h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    <span>Continue</span>
                  )}
                </Button>
              </form>
            </div>
          ) : (
              <div className="text-center py-4 space-y-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Registration Successful
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Your account for <span className="text-zinc-900 dark:text-zinc-200 font-medium">{username}</span> has been provisioned.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                >
                  Proceed to Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Internal Card Footer */}
          <div className="px-7 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Clerk Signature "Secured by" Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
          <Shield className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
          <span>Secured by Vaultix IAM</span>
        </div>
      </main>

      {/* Screen Bottom Footer */}
      <footer className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 pb-2 gap-3">
        <p>&copy; {new Date().getFullYear()} Vaultix, Inc.</p>
        <div className="flex items-center gap-5">
          <a href="#terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Terms</a>
          <a href="#privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#security" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  )
}
