import { apiClient } from '@/lib/api-client'
import type { ApiResponse, AuthTokens, UserProfile, TotpSetupData, TotpActivationData, PasskeyItem } from '@/types/api'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  full_name?: string
  phone_number?: string
}

export interface MfaVerifyPayload {
  mfa_token: string
  code: string
  factor?: 'totp' | 'recovery' | 'sms'
}

export interface PasswordResetRequestPayload {
  identifier: string
}

export interface PasswordResetConfirmPayload {
  identifier: string
  otp: string
  new_password: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthTokens>> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/public/login', {
      identifier: payload.identifier,
      password: payload.password,
    })
    return res.data
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<unknown>> => {
    const res = await apiClient.post<ApiResponse<unknown>>('/auth/public/register', {
      username: payload.username,
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name || undefined,
      phone_number: payload.phone_number || undefined,
    })
    return res.data
  },

  verifyMfa: async (payload: MfaVerifyPayload): Promise<ApiResponse<AuthTokens>> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/public/login/mfa', {
      mfa_token: payload.mfa_token,
      code: payload.code,
      factor: payload.factor,
    })
    return res.data
  },

  logout: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/logout')
    return res.data
  },

  logoutAll: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/logout-all')
    return res.data
  },

  requestPasswordReset: async (payload: PasswordResetRequestPayload): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/public/password-reset/request', {
      identifier: payload.identifier,
    })
    return res.data
  },

  confirmPasswordReset: async (payload: PasswordResetConfirmPayload): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/public/password-reset/confirm', {
      identifier: payload.identifier,
      otp: payload.otp,
      new_password: payload.new_password,
    })
    return res.data
  },

  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/auth/me')
    return res.data
  },

  sendEmailVerification: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/email/send-verification')
    return res.data
  },

  verifyEmail: async (otp: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/email/verify', { otp })
    return res.data
  },

  changePassword: async (newPassword: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/password', {
      new_password: newPassword,
    })
    return res.data
  },

  changeUsername: async (username: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/username', {
      username,
    })
    return res.data
  },

  requestEmailChange: async (newEmail: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/email/change/request', {
      new_email: newEmail,
    })
    return res.data
  },

  confirmEmailChange: async (otp: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/email/change/confirm', {
      otp,
    })
    return res.data
  },

  sendPhoneNumberVerification: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/phone/send-verification')
    return res.data
  },

  verifyPhoneNumber: async (otp: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/phone/verify', { otp })
    return res.data
  },

  requestPhoneNumberChange: async (newPhoneNumber: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/phone/change/request', {
      new_phone_number: newPhoneNumber,
      newPhoneNumber,
    })
    return res.data
  },

  confirmPhoneNumberChange: async (otp: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/phone/change/confirm', {
      otp,
    })
    return res.data
  },

  setupTotp: async (): Promise<ApiResponse<TotpSetupData>> => {
    const res = await apiClient.post<ApiResponse<TotpSetupData>>('/auth/totp/setup')
    return res.data
  },

  activateTotp: async (code: string): Promise<ApiResponse<TotpActivationData>> => {
    const res = await apiClient.post<ApiResponse<TotpActivationData>>('/auth/totp/activate', { code })
    return res.data
  },

  disableTotp: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/totp/disable')
    return res.data
  },

  getRemainingRecoveryCodes: async (): Promise<ApiResponse<number>> => {
    const res = await apiClient.get<ApiResponse<number>>('/auth/totp/recovery-codes')
    return res.data
  },

  regenerateRecoveryCodes: async (): Promise<ApiResponse<TotpActivationData>> => {
    const res = await apiClient.post<ApiResponse<TotpActivationData>>('/auth/totp/recovery-codes/regenerate')
    return res.data
  },

  getPasskeys: async (): Promise<ApiResponse<PasskeyItem[]>> => {
    const res = await apiClient.get<ApiResponse<PasskeyItem[]>>('/auth/mfa/passkeys')
    return res.data
  },

  getPasskeyRegistrationOptions: async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    const res = await apiClient.post<PublicKeyCredentialCreationOptionsJSON>('/auth/webauthn/register/options', {})
    return res.data
  },

  registerPasskey: async (attestation: RegistrationResponseJSON, label?: string): Promise<unknown> => {
    const res = await apiClient.post<unknown>('/auth/webauthn/register', {
      publicKey: {
        credential: attestation,
        label: label?.trim() || 'Passkey',
      },
    })
    return res.data
  },

  updatePasskeyLabel: async (id: string, label: string): Promise<ApiResponse<PasskeyItem>> => {
    const res = await apiClient.patch<ApiResponse<PasskeyItem>>(`/auth/mfa/passkeys/${id}`, { label })
    return res.data
  },

  deletePasskey: async (id: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/auth/mfa/passkeys/${id}`)
    return res.data
  },

  getPasskeyAuthOptions: async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    const res = await apiClient.post<PublicKeyCredentialRequestOptionsJSON>('/auth/webauthn/authenticate/options', {})
    return res.data
  },

  loginWithPasskey: async (assertion: AuthenticationResponseJSON): Promise<ApiResponse<AuthTokens>> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login/webauthn', assertion)
    return res.data
  },

  sendSmsMfaSetupOtp: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/mfa/sms/send-setup-otp')
    return res.data
  },

  enableSmsMfa: async (code: string): Promise<ApiResponse<{ recovery_codes?: string[]; recoveryCodes?: string[] }>> => {
    const res = await apiClient.post<ApiResponse<{ recovery_codes?: string[]; recoveryCodes?: string[] }>>('/auth/mfa/sms/enable', { code })
    return res.data
  },

  disableSmsMfa: async (): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/mfa/sms/disable')
    return res.data
  },

  sendLoginSmsOtp: async (mfaToken: string): Promise<ApiResponse<void>> => {
    const res = await apiClient.post<ApiResponse<void>>('/auth/public/login/mfa/sms/send-otp', {
      mfa_token: mfaToken,
      mfaToken,
    })
    return res.data
  },
}
