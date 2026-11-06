import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Masks a phone number retaining only the last 2 digits matching Google Account
 * privacy and security standards (e.g. ••••••••89), disregarding any country prefix.
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return ''
  const clean = phone.trim()
  if (clean.length <= 2) return clean

  const digits = clean.replace(/\D/g, '')
  if (digits.length <= 2) return clean

  return '••••••••' + digits.slice(-2)
}
