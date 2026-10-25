export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string>
  timestamp?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  mfa_required?: boolean
  mfa_token?: string
  has_recovery_codes?: boolean
  totp_enabled?: boolean
  sms_mfa_enabled?: boolean
  masked_phone_number?: string
}

export interface JwtPayload {
  sub: string
  email?: string
  roles?: string[]
  permissions?: string[]
  hierarchy_level?: number
  jti?: string
  exp?: number
  iat?: number
}

export interface UserProfile {
  id: string
  username: string
  email: string
  full_name?: string
  phone_number?: string
  status?: string
  email_verified?: boolean
  phone_number_verified?: boolean
  mfa_enabled?: boolean
  passkey_enabled?: boolean
  sms_mfa_enabled?: boolean
  has_social_accounts?: boolean
  has_password?: boolean
  last_login_at?: string
  created_at?: string
  roles: string[]
  permissions: string[]
}

export interface UserSession {
  session_id: string
  device_type?: string
  browser?: string
  operating_system?: string
  ip_address?: string
  country?: string
  city?: string
  created_at: string
  last_activity_at: string
  is_current: boolean
}

export interface SigningKeyInfo {
  key_id: string
  algorithm: string
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED'
  created_at: string
  expires_at: string
}

export interface TotpSetupData {
  secret: string
  otpauth_url?: string
  otpauthUrl?: string
}

export interface TotpActivationData {
  recovery_codes?: string[]
  recoveryCodes?: string[]
}

export interface SmsMfaActivationData {
  recovery_codes?: string[]
  recoveryCodes?: string[]
}

export interface RecoveryCodesData {
  recovery_codes?: string[]
  recoveryCodes?: string[]
}

export interface PasskeyItem {
  id: string
  credential_id: string
  label: string
  public_key_credential_type?: string
  transports?: string[]
  backup_eligible?: boolean
  backup_state?: boolean
  created_at: string
  last_used_at?: string
}

export interface SocialAccountItem {
  id: string
  provider: 'GOOGLE' | 'GITHUB'
  provider_user_id: string
  email?: string
  display_name?: string
  avatar_url?: string
  created_at: string
}
