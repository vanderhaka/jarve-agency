'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/terra-flow/ui/scroll-area'
import {
  getNotifications,
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/notifications/actions'
import type { Notification, NotificationCounts } from '@/lib/notifications/types'
import { getEntityUrl, NOTIFICATION_TYPE_LABELS } from '@/lib/notifications/types'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, unread: 0 })
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch notifications and counts on mount and when dropdown opens
  useEffect(() => {
    async function fetchData() {
      const [notifResult, countResult] = await Promise.all([
        getNotifications({ limit: 20 }),
        getNotificationCounts(),
      ])

      if (notifResult.data) {
        setNotifications(notifResult.data)
      }
      if (countResult.data) {
        setCounts(countResult.data)
      }
    }

    fetchData()
  }, [])

  // Refresh data when dropdown opens
  useEffect(() => {
    if (isOpen) {
      async function refreshData() {
        const [notifResult, countResult] = await Promise.all([
          getNotifications({ limit: 20 }),
          getNotificationCounts(),
        ])

        if (notifResult.data) {
          setNotifications(notifResult.data)
        }
        if (countResult.data) {
          setCounts(countResult.data)
        }
      }

      refreshData()
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: string) => {
    startTransition(async () => {
      await markNotificationAsRead(id)
      // Optimistically update the local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setCounts((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }))
    })
  }

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      await markAllNotificationsAsRead()
      // Optimistically update the local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      )
      setCounts((prev) => ({ ...prev, unread: 0 }))
    })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      await deleteNotification(id)
      // Optimistically update the local state
      const deletedNotif = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setCounts((prev) => ({
        total: prev.total - 1,
        unread: deletedNotif && !deletedNotif.read_at ? prev.unread - 1 : prev.unread,
      }))
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {counts.unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {counts.unread > 99 ? '99+' : counts.unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {counts.unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  isPending={isPending}
                />
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/admin/notifications"
                className="flex w-full items-center justify-center text-sm"
              >
                View all notifications
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  isPending: boolean
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isPending,
}: NotificationItemProps) {
  const isUnread = !notification.read_at
  const entityUrl = getEntityUrl(notification.entity_type, notification.entity_id)
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] || notification.type

  return (
    <DropdownMenuItem
      className={cn(
        'flex flex-col items-start gap-1 p-3 cursor-default',
        isUnread && 'bg-muted/50'
      )}
      onSelect={(e) => e.preventDefault()}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isUnread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {typeLabel}
            </span>
          </div>
          <Link
            href={entityUrl}
            className="mt-1 block font-medium text-sm hover:underline truncate"
            onClick={() => isUnread && onMarkAsRead(notification.id)}
          >
            {notification.title}
          </Link>
          {notification.body && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {notification.body}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isUnread && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isPending}
              title="Mark as read"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(notification.id)}
            disabled={isPending}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </DropdownMenuItem>
  )
}
