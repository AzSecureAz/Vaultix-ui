import { create } from 'zustand'

interface PendingRequest {
  resolve: () => void
  reject: (err: unknown) => void
}

interface SudoState {
  isOpen: boolean
  pendingQueue: PendingRequest[]

  requestElevation: () => Promise<void>
  resolveElevation: () => void
  cancelElevation: (reason?: string) => void
}

export const useSudoStore = create<SudoState>((set, get) => ({
  isOpen: false,
  pendingQueue: [],

  requestElevation: () => {
    return new Promise<void>((resolve, reject) => {
      set((state) => ({
        isOpen: true,
        pendingQueue: [...state.pendingQueue, { resolve, reject }],
      }))
    })
  },

  resolveElevation: () => {
    const { pendingQueue } = get()
    pendingQueue.forEach((req) => req.resolve())

    set({
      isOpen: false,
      pendingQueue: [],
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
}))
