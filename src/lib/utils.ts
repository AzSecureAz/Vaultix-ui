import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Masks a phone number displaying country code and trailing digits (e.g. +91 ••••••89 or ••••••89)
 * matching security standards in Google Account (showing only the last 2 digits).
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return ''
  const clean = phone.trim()
  if (clean.length <= 2) return clean

  // Match optional country code (+XX or +XXX) followed by digits
  const countryCodeMatch = clean.match(/^(\+\d{1,4})\s*(.*)$/)
  if (countryCodeMatch) {
    const countryCode = countryCodeMatch[1]
    const rest = countryCodeMatch[2].replace(/\s+/g, '')
    if (rest.length > 2) {
      const masked = '••••••' + rest.slice(-2)
      return `${countryCode} ${masked}`
    }
  }

  return '••••••' + clean.slice(-2)
}
