import { useEffect } from 'react'
import { ShieldAlert, Lock } from 'lucide-react'
import { useSudoStore } from '@/stores/sudoStore'

export function SudoStatusPill() {
  const { isElevated, remainingSeconds, checkStatus, revokeElevation, tick } = useSudoStore()

  useEffect(() => {
    /* Check status on mount */
    checkStatus()

    /* 1-second countdown interval */
    const interval = setInterval(() => {
      tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [checkStatus, tick])

  if (!isElevated || remainingSeconds <= 0) {
    return null
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-800 dark:text-amber-300 shadow-2xs animate-in fade-in duration-300 select-none shrink-0"
      title={`Sudo Mode Active: elevated privileges expire in ${formattedTime}. Click lock to revoke.`}
    >
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </div>
      <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      <span className="font-mono tracking-tight text-xs flex items-center gap-1">
        <span className="hidden md:inline">Sudo Active</span>
        <span className="hidden sm:inline md:hidden">Sudo</span>
        <span className="tabular-nums">
          <span className="hidden sm:inline">(</span>
          {formattedTime}
          <span className="hidden sm:inline">)</span>
        </span>
      </span>
      <button
        type="button"
        onClick={() => revokeElevation()}
        className="ml-0.5 p-1 -mr-1 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-md transition-colors cursor-pointer shrink-0"
        title="Lock Sudo mode immediately"
      >
        <Lock className="h-3 w-3" />
      </button>
    </div>
  )
}

