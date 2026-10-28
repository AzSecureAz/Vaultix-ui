import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/features/admin-roles/api/rolesApi'

export interface UserItem {
  id: string
  username: string
  email: string
  fullName?: string
  phoneNumber?: string
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'DELETED'
  emailVerified: boolean
  phoneNumberVerified: boolean
  mfaEnabled: boolean
  passkeyEnabled: boolean
  smsMfaEnabled: boolean
  hasSocialAccounts: boolean
  failedLoginAttempts?: number
  lockedUntil?: string
  lastLoginAt?: string
  level?: number
  roles: string[]
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface CreateUserPayload {
  username: string
  email: string
  fullName?: string
  roles?: string[]
}

export interface UpdateUserPayload {
  roles?: string[]
}

export const usersApi = {
  getUsers: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<UserItem>>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<UserItem>>>('/auth/admin/users', {
      params: { page, size },
    })
    return res.data
  },

  getUserByIdentifier: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.get<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}`)
    return res.data
  },

  createUser: async (payload: CreateUserPayload): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>('/auth/admin/users', payload)
    return res.data
  },

  updateUser: async (identifier: string, payload: UpdateUserPayload): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.patch<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}`, payload)
    return res.data
  },

  enableUser: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}/enable`)
    return res.data
  },

  disableUser: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}/disable`)
    return res.data
  },

  deleteUser: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.delete<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}`)
    return res.data
  },

  restoreUser: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}/restore`)
    return res.data
  },
}
