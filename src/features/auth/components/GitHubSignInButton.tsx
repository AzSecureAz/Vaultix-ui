import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GitHubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

interface GitHubSignInButtonProps {
  action?: 'login' | 'link'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'connect'
  disabled?: boolean
  isLoading?: boolean
  className?: string
  label?: string
  size?: 'default' | 'lg' | 'sm'
  onError?: (error: string) => void
}

export function GitHubSignInButton({
  action = 'login',
  text = 'continue_with',
  disabled = false,
  isLoading: isLoadingProp = false,
  className = '',
  label,
  size = 'default',
  onError,
}: GitHubSignInButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = isLoadingProp || internalLoading

  const getButtonText = () => {
    if (label) return label
    switch (text) {
      case 'signup_with':
        return 'Sign up with GitHub'
      case 'signin_with':
        return 'Sign in with GitHub'
      case 'connect':
        return 'Connect GitHub'
      case 'continue_with':
      default:
        return 'Continue with GitHub'
    }
  }

  const handleGitHubClick = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId || clientId === 'your_github_client_id_here' || clientId.trim() === '') {
      onError?.('GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID.')
      return
    }

    setInternalLoading(true)

    try {
      const state = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
      sessionStorage.setItem('vaultix_github_oauth_state', state)
      sessionStorage.setItem('vaultix_github_oauth_action', action)

      const redirectUri = `${window.location.origin}/oauth/callback/github`
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
        clientId
      )}&scope=read:user%20user:email&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${encodeURIComponent(state)}`

      window.location.href = githubUrl
    } catch (err: any) {
      setInternalLoading(false)
      onError?.(err?.message || 'Failed to initiate GitHub authentication.')
    }
  }

  const isLg = size === 'lg'

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGitHubClick}
      disabled={disabled || isLoading}
      className={
        isLg
          ? `w-full h-11 sm:h-12 font-semibold text-sm sm:text-base rounded-xl border-zinc-300 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 ${className}`
          : `w-full h-10 font-medium text-xs sm:text-sm rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 ${className}`
      }
    >
      {isLoading ? (
        <Loader2 className={`${isLg ? 'h-5 w-5' : 'h-4 w-4'} animate-spin text-zinc-500`} />
      ) : (
        <GitHubIcon className={`${isLg ? 'h-5 w-5' : 'h-4 w-4'} text-zinc-900 dark:text-zinc-100 shrink-0`} />
      )}
      <span>{isLoading ? 'Connecting to GitHub...' : getButtonText()}</span>
    </Button>
  )
}
