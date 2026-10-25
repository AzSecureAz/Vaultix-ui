import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Shield, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { RegisterPage } from '@/features/auth/components/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/components/ForgotPasswordPage'
import { EmailRevertPage } from '@/features/auth/components/EmailRevertPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { SessionsPage } from '@/features/sessions/SessionsPage'
import { MfaPage } from '@/features/mfa/MfaPage'
import { PasskeysPage } from '@/features/passkeys/PasskeysPage'
import { SigningKeysPage } from '@/features/signing-keys/SigningKeysPage'
import { UsersPage } from '@/features/admin-users/UsersPage'
import { RolesPage } from '@/features/admin-roles/RolesPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuthStore()
  const location = useLocation()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  const { isInitializing, isAuthenticated, checkAuthOnBoot } = useAuthStore()

  useEffect(() => {
    // On app mount, perform silent refresh using stored/cookie refresh token
    checkAuthOnBoot()
  }, [checkAuthOnBoot])

  // Fullscreen Enterprise Security Splash Screen while silent refresh is in-flight
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#090a0f] bg-grid-pattern flex flex-col items-center justify-center relative overflow-hidden select-none transition-colors">
        <div className="z-10 flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-md">
            <Shield className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Vaultix IAM</h2>
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin text-zinc-500 dark:text-zinc-400" />
              <span>Verifying security context...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/email-revert"
        element={<EmailRevertPage />}
      />

      {/* Protected Routes wrapped in AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/mfa" element={<MfaPage />} />
        <Route path="/passkeys" element={<PasskeysPage />} />
        <Route path="/admin/signing-keys" element={<SigningKeysPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/roles" element={<RolesPage />} />
      </Route>

      {/* Root & Catch-all: Directs authenticated users to /dashboard, otherwise /login */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  )
}
