import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Masks a phone number displaying country code and trailing digits (e.g. +91 ••••••8975 or ••••••8975)
 * matching security standards in GitHub and Google Account.
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return ''
  const clean = phone.trim()
  if (clean.length <= 4) return clean

  // Match optional country code (+XX or +XXX) followed by digits
  const countryCodeMatch = clean.match(/^(\+\d{1,4})\s*(.*)$/)
  if (countryCodeMatch) {
    const countryCode = countryCodeMatch[1]
    const rest = countryCodeMatch[2].replace(/\s+/g, '')
    if (rest.length > 4) {
      const masked = '••••••' + rest.slice(-4)
      return `${countryCode} ${masked}`
    }
  }

  return '••••••' + clean.slice(-4)
}
