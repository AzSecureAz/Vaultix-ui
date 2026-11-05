import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NotificationItem } from '@/types/api'

interface NotificationState {
  notifications: NotificationItem[]
  isOpen: boolean

  setIsOpen: (open: boolean) => void
  toggleOpen: () => void
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  removeNotification: (id: string) => void
  unreadCount: () => number
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    title: 'Enterprise Identity Guard Active',
    message: 'Hardware key compliance, RBAC policy governance, and token replay protection are actively guarding your account.',
    type: 'security',
    severity: 'success',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: '/dashboard',
    actionLabel: 'Review Profile',
  },
  {
    id: 'notif-session-current',
    title: 'New Session Established',
    message: 'Authorized session created from this browser. Client IP and platform telemetry registered.',
    type: 'session',
    severity: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    actionUrl: '/sessions',
    actionLabel: 'Active Sessions',
  },
]

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      addNotification: (item) => {
        const newItem: NotificationItem = {
          ...item,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((state) => ({
          notifications: [newItem, ...state.notifications],
        }))
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      unreadCount: () => {
        return get().notifications.filter((n) => !n.read).length
      },
    }),
    {
      name: 'vaultix_notifications_v1',
    }
  )
)

