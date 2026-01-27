'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  entity_type: string
  entity_id: string
  read_at: string | null
  created_at: string
}

function getNotificationUrl(notification: Notification): string {
  switch (notification.entity_type) {
    case 'task':
      return `/admin/projects?task=${notification.entity_id}`
    case 'milestone':
      return `/admin/projects?milestone=${notification.entity_id}`
    case 'invoice':
      return `/admin/invoices/${notification.entity_id}`
    case 'proposal':
      return `/admin/proposals/${notification.entity_id}`
    case 'change_request':
      return `/admin/projects?cr=${notification.entity_id}`
    default:
      return '/admin'
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'overdue_task':
      return '📋'
    case 'overdue_milestone':
      return '🎯'
    case 'overdue_invoice':
      return '💰'
    case 'proposal_pending':
    case 'proposal_signed':
      return '📝'
    case 'change_request_pending':
    case 'change_request_signed':
      return '📑'
    case 'invoice_paid':
      return '✅'
    default:
      return '🔔'
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20&includeRead=true')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications()
    
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Refresh when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 transition-colors relative group',
                    !notification.read_at && 'bg-muted/30'
                  )}
                >
                  <div className="flex gap-3">
                    <span className="text-lg shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={getNotificationUrl(notification)}
                        onClick={() => {
                          if (!notification.read_at) {
                            markAsRead(notification.id)
                          }
                          setIsOpen(false)
                        }}
                        className="block"
                      >
                        <p className="font-medium text-sm leading-tight truncate">
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </Link>
                    </div>
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        aria-label="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {!notification.read_at && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
