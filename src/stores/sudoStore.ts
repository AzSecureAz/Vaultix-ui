import { create } from 'zustand'
import { authApi } from '@/features/auth/api/authApi'
import { toast } from 'sonner'

interface PendingRequest {
  resolve: () => void
  reject: (err: unknown) => void
}

interface SudoState {
  isOpen: boolean
  pendingQueue: PendingRequest[]
  isElevated: boolean
  expiresAt: number | null
  remainingSeconds: number

  requestElevation: () => Promise<void>
  resolveElevation: (expiresInSeconds?: number) => void
  cancelElevation: (reason?: string) => void
  checkStatus: () => Promise<void>
  revokeElevation: () => Promise<void>
  tick: () => void
}

export const useSudoStore = create<SudoState>((set, get) => ({
  isOpen: false,
  pendingQueue: [],
  isElevated: false,
  expiresAt: null,
  remainingSeconds: 0,

  requestElevation: () => {
    return new Promise<void>((resolve, reject) => {
      set((state) => ({
        isOpen: true,
        pendingQueue: [...state.pendingQueue, { resolve, reject }],
      }))
    })
  },

  resolveElevation: (expiresInSeconds = 1800) => {
    const { pendingQueue } = get()
    pendingQueue.forEach((req) => req.resolve())

    const now = Date.now()
    const exp = now + expiresInSeconds * 1000

    set({
      isOpen: false,
      pendingQueue: [],
      isElevated: true,
      expiresAt: exp,
      remainingSeconds: expiresInSeconds,
    })
  },

  cancelElevation: (reason = 'Sudo elevation prompt was cancelled') => {
    const { pendingQueue } = get()
    const err = new Error(reason)
    pendingQueue.forEach((req) => req.reject(err))

    set({
      isOpen: false,
      pendingQueue: [],
    })
  },

  checkStatus: async () => {
    try {
      const res = await authApi.getSudoStatus()
      if (res.success && res.data) {
        const isElevated = Boolean(res.data.elevated ?? res.data.active)
        const seconds = res.data.expires_in_seconds ?? res.data.expiresInSeconds ?? res.data.remaining_seconds ?? 0
        if (isElevated && seconds > 0) {
          set({
            isElevated: true,
            expiresAt: Date.now() + seconds * 1000,
            remainingSeconds: seconds,
          })
          return
        }
      }
      set({ isElevated: false, expiresAt: null, remainingSeconds: 0 })
    } catch {
      set({ isElevated: false, expiresAt: null, remainingSeconds: 0 })
    }
  },

  revokeElevation: async () => {
    try {
      await authApi.revokeSudo()
      toast.info('Sudo mode locked. Privileged actions will now require step-up authentication.')
    } catch (err) {
      console.warn('Failed to revoke sudo on server:', err)
    } finally {
      set({ isElevated: false, expiresAt: null, remainingSeconds: 0 })
    }
  },

  tick: () => {
    const { expiresAt, isElevated } = get()
    if (!isElevated || !expiresAt) return

    const now = Date.now()
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))

    if (remaining <= 0) {
      set({ isElevated: false, expiresAt: null, remainingSeconds: 0 })
    } else {
      set({ remainingSeconds: remaining })
    }
  },
}))
