import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import type { ApiResponse, AuthTokens } from '@/types/api'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else if (token) {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

// Whitelist of endpoints that must never receive an Authorization header
const PUBLIC_ENDPOINTS = [
  '/auth/public/',
  '/public/',
  '/jwks.json',
  '/actuator/health',
]

// Request Interceptor: Attach Bearer Access Token only for protected endpoints
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isPublic = PUBLIC_ENDPOINTS.some((path) => config.url?.includes(path))

    if (!isPublic) {
      const token = useAuthStore.getState().accessToken
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Auto-Refresh Token Rotation on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken

      // If no refresh token or trying to refresh itself, log out
      if (!refreshToken || originalRequest.url?.includes('/auth/public/refresh') || originalRequest.url?.includes('/auth/public/login')) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post<ApiResponse<AuthTokens>>('/api/v1/auth/public/refresh', {
          refresh_token: refreshToken,
        })

        if (response.data.success && response.data.data?.access_token) {
          const newTokens = response.data.data
          useAuthStore.getState().setAuth(newTokens)
          processQueue(null, newTokens.access_token)
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`
          return apiClient(originalRequest)
        } else {
          throw new Error('Refresh failed')
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
