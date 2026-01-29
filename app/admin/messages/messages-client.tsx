'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { PORTAL_DASHBOARD_CHANNEL, PORTAL_DASHBOARD_EVENT, PORTAL_MESSAGES_READ_EVENT } from '@/lib/integrations/portal/realtime'
import { postOwnerMessage, updateOwnerReadState } from '@/lib/integrations/portal/actions/messages'

interface Conversation {
  projectId: string
  projectName: string
  unreadCount: number
  latestMessageAt: string
  recentMessages: { id: string; body: string; createdAt: string }[]
}

export function MessagesClient({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Realtime updates
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${PORTAL_DASHBOARD_CHANNEL}-messages-page`)
      .on('broadcast', { event: PORTAL_DASHBOARD_EVENT }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  const handleReply = async (projectId: string) => {
    const text = replyTexts[projectId]?.trim()
    if (!text) return

    setSending(prev => ({ ...prev, [projectId]: true }))
    try {
      const result = await postOwnerMessage(projectId, text)
      if (result.success) {
        setReplyTexts(prev => ({ ...prev, [projectId]: '' }))
        await updateOwnerReadState(projectId)
        // Remove conversation from list after reply + read
        setConversations(prev => prev.filter(c => c.projectId !== projectId))
        // Notify nav link to refresh unread state
        const supabase = createClient()
        supabase.channel(PORTAL_DASHBOARD_CHANNEL).send({
          type: 'broadcast',
          event: PORTAL_MESSAGES_READ_EVENT,
          payload: {},
        })
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
    } finally {
      setSending(prev => ({ ...prev, [projectId]: false }))
    }
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No unread messages</p>
            <p className="text-sm mt-1">All caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {conversations.map((conv) => (
        <Card key={conv.projectId}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{conv.projectName}</CardTitle>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {conv.unreadCount} unread
                </span>
              </div>
              <Link
                href={`/admin/projects/${conv.projectId}?tab=chat`}
                target="_blank"
              >
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Full chat
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              {conv.recentMessages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <p>{msg.body}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Quick reply..."
                value={replyTexts[conv.projectId] || ''}
                onChange={(e) => setReplyTexts(prev => ({ ...prev, [conv.projectId]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(conv.projectId)
                  }
                }}
                disabled={sending[conv.projectId]}
              />
              <Button
                size="icon"
                onClick={() => handleReply(conv.projectId)}
                disabled={!replyTexts[conv.projectId]?.trim() || sending[conv.projectId]}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
