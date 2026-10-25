import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { AuthTokens, UserProfile, ApiResponse } from '@/types/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  isInitializing: boolean
  setAuth: (tokens: AuthTokens) => Promise<void>
  setAccessToken: (token: string) => void
  fetchProfile: () => Promise<UserProfile | null>
  logout: () => Promise<void>
  logoutOther: () => Promise<void>
  logoutAll: () => Promise<void>
  checkAuthOnBoot: () => Promise<boolean>
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isInitializing: true,

      fetchProfile: async () => {
        const token = get().accessToken
        if (!token) {
          set({ user: null, isAuthenticated: false, isInitializing: false })
          return null
        }
        try {
          const res = await axios.get<ApiResponse<UserProfile>>('/api/v1/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          })

          if (res.data?.success && res.data?.data) {
            const profile = res.data.data
            set({
              user: profile,
              isAuthenticated: true,
              isInitializing: false,
            })
            return profile
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
        }
        return null
      },

      setAuth: async (tokens: AuthTokens) => {
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || get().refreshToken,
          isAuthenticated: true,
        })
        await get().fetchProfile()
      },

      setAccessToken: (token: string) => {
        set({
          accessToken: token,
          isAuthenticated: true,
        })
        get().fetchProfile()
      },

      logout: async () => {
        const token = get().accessToken
        try {
          if (token) {
            await axios.post(
              '/api/v1/auth/logout',
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
              }
            )
          }
        } catch (err) {
          console.warn('Backend logout failed or session already expired:', err)
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isInitializing: false,
          })
        }
      },

      logoutOther: async () => {
        const token = get().accessToken
        if (!token) return
        await axios.post(
          '/api/v1/auth/logout-other',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        )
      },

      logoutAll: async () => {
        const token = get().accessToken
        try {
          if (token) {
            await axios.post(
              '/api/v1/auth/logout-all',
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
              }
            )
          }
        } catch (err) {
          console.warn('Backend logout-all failed or session already expired:', err)
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isInitializing: false,
          })
        }
      },

      checkAuthOnBoot: async () => {
        try {
          const storedRefreshToken = get().refreshToken
          const res = await axios.post<ApiResponse<AuthTokens>>(
            '/api/v1/auth/public/refresh',
            storedRefreshToken ? { refresh_token: storedRefreshToken } : {},
            { withCredentials: true }
          )

          if (res.data?.success && res.data?.data?.access_token) {
            const tokens = res.data.data
            set({
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token || storedRefreshToken,
              isAuthenticated: true,
            })
            const profile = await get().fetchProfile()
            if (profile) {
              return true
            }
          }
        } catch {
          // No active session or token expired
        }

        get().logout()
        return false
      },

      hasRole: (role: string) => {
        const user = get().user
        if (!user || !user.roles) return false
        const cleanRole = role.startsWith('ROLE_') ? role.substring(5) : role
        return user.roles.some(
          (r) => r === role || r === `ROLE_${cleanRole}` || r === cleanRole
        )
      },

      hasPermission: (permission: string) => {
        const user = get().user
        return user?.permissions?.includes(permission) || false
      },
    }),
    {
      name: 'vaultix-auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
    }
  )
)
