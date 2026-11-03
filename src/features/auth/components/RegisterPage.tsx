import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
import { LegalModal, type LegalModalType } from '@/components/ui/LegalModal'

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
  const [legalModalType, setLegalModalType] = useState<LegalModalType>(null)

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
      toast.error('Please resolve the highlighted field errors.')
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
        toast.success('Account created successfully! Welcome to Vaultix.')
      } else {
        const msg = response.message || 'Registration failed'
        setError(msg)
        toast.error(msg)
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
          const msg = unhandled.map(([, val]) => val).join('. ')
          setError(msg)
          toast.error(msg)
        } else {
          toast.error('Please fix the indicated errors')
        }
      } else {
        const msg =
          errData?.message ||
          errData?.error ||
          'Registration could not be completed. Please check your details.'
        setError(msg)
        toast.error(msg)
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
          toast.info('Two-step verification required')
          navigate('/login')
        } else {
          await setAuth(response.data)
          toast.success('Registered successfully with Google!')
          navigate('/dashboard')
        }
      } else {
        const msg = response.message || 'Google registration failed.'
        setError(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      const errData = err?.response?.data
      const msg =
        errData?.message ||
        errData?.error ||
        'Failed to sign up with Google.'
      setError(msg)
      toast.error(msg)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#fafbfc] dark:bg-[#09090b] bg-grid-pattern text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 transition-colors overflow-hidden">
      {/* Ambient Lighting Cones */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-transparent blur-[140px] pointer-events-none -z-0" />

      {/* Top Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between pt-2">
        <Logo size="sm" subtitle="IAM" />
        <ThemeToggle variant="segmented" />
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 my-auto w-full max-w-[480px] sm:max-w-[500px] mx-auto py-6">
        <div className="rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111116]/95 backdrop-blur-2xl shadow-xl shadow-zinc-950/5 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_20px_50px_-10px_rgba(0,0,0,0.7)] overflow-hidden transition-all">
          {/* Card Header with Centered Emblem */}
          <div className="p-7 sm:p-8 pb-4 sm:pb-5 text-center">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
              <Shield className="h-7 w-7 text-white stroke-[2.4]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Create your account
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 font-medium">
              Welcome! Please fill in the details to get started.
            </p>
          </div>

          {/* Card Body */}
          <div className="px-7 sm:px-8 pb-7 sm:pb-8">
            {error && (
              <div className="mb-4.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isSuccess ? (
              <div className="space-y-4">
                {/* Google Sign Up */}
                <GoogleSignInButton
                  onSuccess={handleGoogleSignUp}
                  onError={(msg) => {
                    setError(msg)
                    toast.error(msg)
                  }}
                  disabled={googleLoading || loading}
                  isLoading={googleLoading}
                  text="signup_with"
                  size="lg"
                />

                {/* GitHub Sign Up */}
                <GitHubSignInButton
                  action="login"
                  text="signup_with"
                  onError={(msg) => {
                    setError(msg)
                    toast.error(msg)
                  }}
                  disabled={googleLoading || loading}
                  size="lg"
                />

                {/* Divider */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-[#111116] px-3 text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-wider">
                      or register with details
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                      className={`h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                        fieldErrors.username
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-zinc-300 dark:border-zinc-700/80'
                      }`}
                    />
                    {fieldErrors.username ? (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.username}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 font-medium">
                        3-128 chars, lowercase letters, numbers, dots, hyphens
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                      className={`h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                        fieldErrors.email
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-zinc-300 dark:border-zinc-700/80'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Full name <span className="text-zinc-500 font-normal">(optional)</span>
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
                      className={`h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                        fieldErrors.fullName
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-zinc-300 dark:border-zinc-700/80'
                      }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Phone number <span className="text-zinc-500 font-normal">(optional)</span>
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
                      size="lg"
                    />
                    {fieldErrors.phoneNumber ? (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.phoneNumber}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 font-medium">
                        Select country dial code &amp; enter mobile phone number
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                        className={`h-11 sm:h-12 pr-11 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                          fieldErrors.password
                            ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                            : 'border-zinc-300 dark:border-zinc-700/80'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                      className={`h-11 sm:h-12 text-sm sm:text-base px-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-950/40 focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium ${
                        fieldErrors.confirmPassword
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200'
                          : 'border-zinc-300 dark:border-zinc-700/80'
                      }`}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in-50 duration-150">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* Password Criteria Checklist */}
                  <div className="p-3.5 sm:p-4 bg-zinc-50 dark:bg-zinc-950/70 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm space-y-1.5">
                    <p className="text-zinc-700 dark:text-zinc-300 font-semibold mb-1">Password requirements:</p>
                    <div className="grid grid-cols-2 gap-2 text-zinc-500 dark:text-zinc-400">
                      <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                        <Check className="h-3.5 w-3.5" /> Min 8 characters
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                        <Check className="h-3.5 w-3.5" /> Uppercase letter
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                        <Check className="h-3.5 w-3.5" /> Lowercase letter
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                        <Check className="h-3.5 w-3.5" /> Numeric digit
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                        <Check className="h-3.5 w-3.5" /> Special symbol
                      </span>
                      <span className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                        <Check className="h-3.5 w-3.5" /> Passwords match
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="w-full mt-2 h-11 sm:h-12 font-bold text-sm sm:text-base rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        <span>Creating Account...</span>
                      </span>
                    ) : (
                      <span>Continue</span>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-7 w-7" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-lg font-bold text-zinc-950 dark:text-white">
                    Registration Successful
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                    Your account for <span className="text-zinc-950 dark:text-white font-bold">@{username}</span> has been provisioned.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11 sm:h-12 font-bold text-sm sm:text-base rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md cursor-pointer"
                >
                  Proceed to Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Internal Card Footer */}
          <div className="px-7 sm:px-8 py-4.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/50 text-center text-sm text-zinc-600 dark:text-zinc-400 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-zinc-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Secured by Badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
          <Shield className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>Secured by Vaultix IAM</span>
        </div>
      </main>

      {/* Screen Bottom Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pb-2 gap-3 font-medium">
        <p>&copy; {new Date().getFullYear()} Vaultix, Inc.</p>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setLegalModalType('terms')}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => setLegalModalType('privacy')}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setLegalModalType('security')}
            className="hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer font-semibold"
          >
            Security
          </button>
        </div>
      </footer>

      <LegalModal
        type={legalModalType}
        isOpen={!!legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  )
}
