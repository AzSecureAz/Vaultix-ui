import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'

export interface SessionItem {
  id: string
  device_info: string
  ip_address: string
  location_info: string
  current: boolean
  created_at: string
  last_active_at: string
  expires_at: string
}

export interface PageMetadata {
  size: number
  number: number
  total_elements: number
  total_pages: number
}

export interface PageResponse<T> {
  content: T[]
  page?: PageMetadata
  total_elements?: number
  totalElements?: number
  total_pages?: number
  totalPages?: number
  size?: number
  number?: number
  empty?: boolean
  first?: boolean
  last?: boolean
  [key: string]: unknown
}

export const sessionsApi = {
  getCurrentSession: async (): Promise<ApiResponse<SessionItem>> => {
    const res = await apiClient.get<ApiResponse<SessionItem>>('/auth/sessions/current')
    return res.data
  },

  getOtherSessions: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<SessionItem>>> => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))
    const res = await apiClient.get<ApiResponse<PageResponse<SessionItem>>>(
      `/auth/sessions?${params.toString()}`
    )
    return res.data
  },

  revokeSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/auth/sessions/${sessionId}`)
    return res.data
  },

  revokeOtherSessions: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>('/auth/sessions/other')
    return res.data
  },

  revokeAllSessions: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>('/auth/sessions')
    return res.data
  },
}

