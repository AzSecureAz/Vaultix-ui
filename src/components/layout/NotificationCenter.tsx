import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ShieldCheck,
  ShieldAlert,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  Laptop,
  KeyRound,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore } from '@/stores/notificationStore'
import type { NotificationItem } from '@/types/api'

export function NotificationCenter() {
  const {
    notifications,
    isOpen,
    setIsOpen,
    toggleOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    unreadCount,
  } = useNotificationStore()

  const [activeTab, setActiveTab] = useState<'all' | 'security' | 'session'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobilePanelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const unread = unreadCount()

  /* Close on click outside and escape key */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedTriggerOrDesktop = dropdownRef.current?.contains(target)
      const clickedMobilePanel = mobilePanelRef.current?.contains(target)

      if (!clickedTriggerOrDesktop && !clickedMobilePanel) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, setIsOpen])

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true
    return item.type === activeTab
  })

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays}d ago`
    } catch {
      return 'Recently'
    }
  }

  const getSeverityIcon = (item: NotificationItem) => {
    switch (item.severity) {
      case 'critical':
      case 'warning':
        return <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
      case 'success':
        return <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
      default:
        if (item.type === 'session') return <Laptop className="h-4 w-4 text-blue-500 shrink-0" />
        if (item.type === 'security') return <KeyRound className="h-4 w-4 text-purple-500 shrink-0" />
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />
    }
  }

  /* Shared content rendered inside both the mobile portal and desktop popover */
  const panelContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-zinc-950 dark:text-white">Security Activity</h4>
          {unread > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold border-blue-500/30 text-blue-600 dark:text-blue-400">
              {unread} new
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="p-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-medium hidden sm:inline">Mark read</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-white/[0.01] text-xs font-medium shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          Security
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('session')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            activeTab === 'session'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          Sessions
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 min-h-0">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All caught up</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No active security alerts or pending events for your account.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.03] ${
                !item.read ? 'bg-blue-500/[0.04] dark:bg-blue-500/[0.06]' : ''
              }`}
            >
              <div className="mt-0.5">{getSeverityIcon(item)}</div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs sm:text-sm font-bold tracking-tight truncate ${!item.read ? 'text-zinc-950 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {item.title}
                  </p>
                  <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                    {formatTimeAgo(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                {item.actionUrl && item.actionLabel && (
                  <div className="pt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(item.id)
                        setIsOpen(false)
                        navigate(item.actionUrl!)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Item */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeNotification(item.id)
                }}
                className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-zinc-500 font-medium">
            {notifications.length} total event{notifications.length > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-semibold text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            Clear all activity
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleOpen}
        className="relative text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white h-9 w-9 rounded-xl cursor-pointer"
        title="Notifications & Security Activity"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {/* Mobile Modal Portal: rendered directly in document.body to bypass header backdrop-filter containing block */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] sm:hidden">
            {/* Fullscreen Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
              onClick={() => setIsOpen(false)}
            />

            {/* Centered Mobile Sheet with 12px viewport margins */}
            <div
              ref={mobilePanelRef}
              className="fixed inset-x-3 top-[68px] max-h-[calc(100dvh-84px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] shadow-2xl z-[101] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {panelContent}
            </div>
          </div>,
          document.body
        )}

      {/* Desktop Flyout Dropdown: anchored directly under Bell icon trigger */}
      {isOpen && (
        <div className="hidden sm:flex flex-col absolute right-0 top-full mt-2 w-[400px] max-h-[520px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111116] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {panelContent}
        </div>
      )}
    </div>
  )
}
