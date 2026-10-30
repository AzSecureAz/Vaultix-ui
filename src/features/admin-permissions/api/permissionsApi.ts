import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'

export type PermissionStatus = 'ENABLED' | 'DISABLED'

export interface PermissionItem {
  id: string
  name: string
  description?: string
  status: PermissionStatus
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
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

export const permissionsApi = {
  getPermissions: async (page = 0, size = 50): Promise<ApiResponse<PageResponse<PermissionItem>>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<PermissionItem>>>(
      `/auth/admin/permissions?page=${page}&size=${size}`
    )
    return res.data
  },

  searchPermissions: async (
    payload: { search?: string } = {},
    page = 0,
    size = 50
  ): Promise<ApiResponse<PageResponse<PermissionItem>>> => {
    const res = await apiClient.post<ApiResponse<PageResponse<PermissionItem>>>(
      `/auth/admin/permissions/search?page=${page}&size=${size}`,
      payload
    )
    return res.data
  },

  getPermissionByIdentifier: async (identifier: string): Promise<ApiResponse<PermissionItem>> => {
    const res = await apiClient.get<ApiResponse<PermissionItem>>(
      `/auth/admin/permissions/${encodeURIComponent(identifier)}`
    )
    return res.data
  },

  enablePermission: async (identifier: string): Promise<ApiResponse<PermissionItem>> => {
    const res = await apiClient.post<ApiResponse<PermissionItem>>(
      `/auth/admin/permissions/${encodeURIComponent(identifier)}/enable`
    )
    return res.data
  },

  disablePermission: async (identifier: string): Promise<ApiResponse<PermissionItem>> => {
    const res = await apiClient.post<ApiResponse<PermissionItem>>(
      `/auth/admin/permissions/${encodeURIComponent(identifier)}/disable`
    )
    return res.data
  },
}
