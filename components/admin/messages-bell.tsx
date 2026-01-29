'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { PORTAL_DASHBOARD_CHANNEL, PORTAL_DASHBOARD_EVENT } from '@/lib/integrations/portal/realtime'
import { getUnreadMessagesWithPreview } from '@/lib/integrations/portal/actions/messages'

interface UnreadConversation {
  projectId: string
  projectName: string
  unreadCount: number
  latestMessageAt: string
  latestMessageBody: string
}

export function MessagesBell() {
  const [conversations, setConversations] = useState<UnreadConversation[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [, startTransition] = useTransition()

  const fetchUnread = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getUnreadMessagesWithPreview()
        if (result.success) {
          setConversations(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch unread messages:', error)
      }
    })
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchUnread()
  }, [fetchUnread])

  // Refresh when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchUnread()
    }
  }, [isOpen, fetchUnread])

  // Subscribe to realtime broadcasts
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${PORTAL_DASHBOARD_CHANNEL}-messages-bell`)
      .on('broadcast', { event: PORTAL_DASHBOARD_EVENT }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUnread])

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Messages${totalUnread > 0 ? ` (${totalUnread} unread)` : ''}`}
        >
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Messages</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No unread messages</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => (
                <Link
                  key={conv.projectId}
                  href={`/admin/projects/${conv.projectId}?tab=chat`}
                  target="_blank"
                  onClick={() => setIsOpen(false)}
                  className="flex gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{conv.projectName}</span>
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {conv.unreadCount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {conv.latestMessageBody}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(conv.latestMessageAt), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Link href="/admin/messages" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full text-sm">
              View all messages
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
