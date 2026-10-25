import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void
          renderButton: (parent: HTMLElement, options: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

export function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void
  onError?: (error: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  disabled?: boolean
  className?: string
  label?: string
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false,
  className = '',
  label,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const isConfigured = Boolean(clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID')

  useEffect(() => {
    if (!isConfigured) return

    let checkInterval: ReturnType<typeof setInterval> | null = null
    let attempts = 0

    const initGsi = () => {
      if (window.google?.accounts?.id && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential: string }) => {
              setIsLoading(true)
              if (response?.credential) {
                onSuccess(response.credential)
              } else {
                setIsLoading(false)
                onError?.('No credential returned from Google')
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          const isDark = document.documentElement.classList.contains('dark')

          containerRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            text: text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 380,
          })

          setIsRendered(true)
        } catch (err: any) {
          console.warn('Google GSI render error:', err)
        }
      }
    }

    if (window.google?.accounts?.id) {
      initGsi()
    } else {
      checkInterval = setInterval(() => {
        attempts++
        if (window.google?.accounts?.id) {
          if (checkInterval) clearInterval(checkInterval)
          initGsi()
        } else if (attempts > 30) {
          if (checkInterval) clearInterval(checkInterval)
        }
      }, 100)
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [clientId, isConfigured, text, onSuccess, onError])

  const handleClickFallback = () => {
    if (!isConfigured) {
      onError?.(
        'Google OAuth2 is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file or environment.'
      )
      return
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.info('Google One Tap not displayed:', notification.getNotDisplayedReason?.())
        }
      })
    }
  }

  const defaultLabel =
    label ||
    (text === 'signup_with'
      ? 'Sign up with Google'
      : text === 'signin_with'
        ? 'Sign in with Google'
        : 'Continue with Google')

  return (
    <div className={`w-full relative ${className}`}>
      {/* Hidden/Mounted GSI iframe container */}
      <div
        ref={containerRef}
        className={`w-full flex justify-center [&>div]:w-full ${isRendered && !isLoading ? 'block' : 'hidden'}`}
      />

      {/* Styled fallback button if GSI not rendered or loading */}
      {(!isRendered || isLoading) && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClickFallback}
          disabled={disabled || isLoading}
          className="w-full h-10 font-medium text-xs sm:text-sm rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <GoogleIcon className="h-4 w-4 shrink-0" />
          )}
          <span>{isLoading ? 'Verifying with Google...' : defaultLabel}</span>
        </Button>
      )}
    </div>
  )
}
