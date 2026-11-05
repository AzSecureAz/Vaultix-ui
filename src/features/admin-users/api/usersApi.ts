import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/features/admin-roles/api/rolesApi'

export interface UserItem {
  id: string
  username: string
  email: string
  full_name?: string
  fullName?: string
  phone_number?: string
  phoneNumber?: string
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'DELETED'
  email_verified: boolean
  emailVerified?: boolean
  phone_number_verified?: boolean
  phoneNumberVerified?: boolean
  mfa_enabled?: boolean
  mfaEnabled?: boolean
  passkey_enabled?: boolean
  passkeyEnabled?: boolean
  sms_mfa_enabled?: boolean
  smsMfaEnabled?: boolean
  has_social_accounts?: boolean
  hasSocialAccounts?: boolean
  has_password?: boolean
  hasPassword?: boolean
  failed_login_attempts?: number
  failedLoginAttempts?: number
  locked_until?: string
  lockedUntil?: string
  last_login_at?: string
  lastLoginAt?: string
  level?: number
  roles: string[]
  created_at: string
  createdAt?: string
  created_by?: string
  createdBy?: string
  updated_at?: string
  updatedAt?: string
  updated_by?: string
  updatedBy?: string
}

export interface UserSearchFilterPayload {
  search?: string
  statuses?: ('ACTIVE' | 'DISABLED' | 'DELETED')[]
  mfaEnabled?: boolean
  minFailedLoginAttempts?: number
  emailVerified?: boolean
  phoneNumberVerified?: boolean
  roles?: string[]
}

export interface CreateUserPayload {
  username: string
  email: string
  full_name?: string
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

  searchUsers: async (
    payload: UserSearchFilterPayload = {},
    page = 0,
    size = 10
  ): Promise<ApiResponse<PageResponse<UserItem>>> => {
    const res = await apiClient.post<ApiResponse<PageResponse<UserItem>>>(
      `/auth/admin/users/search?page=${page}&size=${size}`,
      payload
    )
    return res.data
  },

  getUserByIdentifier: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.get<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}`)
    return res.data
  },

  createUser: async (payload: CreateUserPayload): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>('/auth/admin/users', {
      username: payload.username,
      email: payload.email,
      full_name: payload.full_name || payload.fullName,
      roles: payload.roles,
    })
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

  resetMfa: async (identifier: string): Promise<ApiResponse<UserItem>> => {
    const res = await apiClient.post<ApiResponse<UserItem>>(`/auth/admin/users/${encodeURIComponent(identifier)}/reset-mfa`)
    return res.data
  },
}
