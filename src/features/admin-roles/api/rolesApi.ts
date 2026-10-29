import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'

export type RoleStatus = 'ENABLED' | 'DISABLED' | 'DELETED'

export interface RoleItem {
  id: string
  name: string
  description?: string
  level: number
  status: RoleStatus
  permissions?: string[]
  created_at?: string
  created_by?: string
  updated_at?: string
  updated_by?: string
}

export interface CreateRolePayload {
  name: string
  description?: string
  level: number
  permissions?: string[]
}

export interface UpdateRolePayload {
  description?: string
  level?: number
  permissions?: string[]
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

export const rolesApi = {
  getRoles: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<RoleItem>>> => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))
    const res = await apiClient.get<ApiResponse<PageResponse<RoleItem>>>(
      `/auth/admin/roles?${params.toString()}`
    )
    return res.data
  },

  getAssignableRoles: async (search?: string, page = 0, size = 30): Promise<ApiResponse<PageResponse<RoleItem>>> => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))
    if (search && search.trim()) {
      params.set('search', search.trim())
    }
    const res = await apiClient.get<ApiResponse<PageResponse<RoleItem>>>(
      `/auth/admin/roles/assignable?${params.toString()}`
    )
    return res.data
  },

  getRoleByIdentifier: async (identifier: string): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.get<ApiResponse<RoleItem>>(
      `/auth/admin/roles/${encodeURIComponent(identifier)}`
    )
    return res.data
  },

  createRole: async (payload: CreateRolePayload): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.post<ApiResponse<RoleItem>>('/auth/admin/roles', payload)
    return res.data
  },

  updateRole: async (identifier: string, payload: UpdateRolePayload): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.put<ApiResponse<RoleItem>>(
      `/auth/admin/roles/${encodeURIComponent(identifier)}`,
      payload
    )
    return res.data
  },

  enableRole: async (identifier: string): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.post<ApiResponse<RoleItem>>(
      `/auth/admin/roles/${encodeURIComponent(identifier)}/enable`
    )
    return res.data
  },

  disableRole: async (identifier: string): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.post<ApiResponse<RoleItem>>(
      `/auth/admin/roles/${encodeURIComponent(identifier)}/disable`
    )
    return res.data
  },

  deleteRole: async (identifier: string): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.delete<ApiResponse<RoleItem>>(
      `/auth/admin/roles/${encodeURIComponent(identifier)}`
    )
    return res.data
  },

  restoreRole: async (identifier: string): Promise<ApiResponse<RoleItem>> => {
    const res = await apiClient.post<ApiResponse<RoleItem>>(
      `/auth/admin/roles/${encodeURIComponent(identifier)}/restore`
    )
    return res.data
  },
}

