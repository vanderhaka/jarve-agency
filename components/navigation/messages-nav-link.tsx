'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/terra-flow/utils'
import { useState, useEffect, useCallback, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PORTAL_DASHBOARD_CHANNEL, PORTAL_DASHBOARD_EVENT, PORTAL_MESSAGES_READ_EVENT } from '@/lib/integrations/portal/realtime'
import { getUnreadMessagesWithPreview } from '@/lib/integrations/portal/actions/messages'

export function MessagesNavLink() {
  const pathname = usePathname()
  const isActive = pathname.startsWith('/admin/messages')
  const [hasUnread, setHasUnread] = useState(false)
  const [, startTransition] = useTransition()

  const fetchUnread = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getUnreadMessagesWithPreview()
        if (result.success) {
          setHasUnread(result.data.length > 0)
        }
      } catch {
        // ignore
      }
    })
  }, [])

  useEffect(() => {
    fetchUnread()
  }, [fetchUnread])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${PORTAL_DASHBOARD_CHANNEL}-messages-nav`)
      .on('broadcast', { event: PORTAL_DASHBOARD_EVENT }, () => {
        fetchUnread()
      })
      .on('broadcast', { event: PORTAL_MESSAGES_READ_EVENT }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUnread])

  return (
    <Link
      href="/admin/messages"
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-all inline-flex items-center gap-2 relative',
        isActive
          ? 'bg-gray-900 text-white shadow dark:bg-white dark:text-gray-900'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <span className="relative">
        <MessageSquare className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />
        )}
      </span>
      Messages
    </Link>
  )
}
