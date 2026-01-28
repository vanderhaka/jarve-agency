'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { postOwnerMessage, updateOwnerReadState } from '@/lib/integrations/portal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { getPortalChatChannel, PORTAL_CHAT_EVENT } from '@/lib/integrations/portal/realtime'

interface Message {
  id: string
  project_id: string
  author_type: string
  author_id: string | null
  body: string
  created_at: string
}

interface AdminChatInterfaceProps {
  projectId: string
  projectName: string
  clientName: string
  clientUserName: string | null
  initialMessages: Message[]
}

const MAX_MESSAGE_LENGTH = 2000

export function AdminChatInterface({
  projectId,
  projectName,
  clientName,
  clientUserName,
  initialMessages,
}: AdminChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Mark messages as read when viewing
  useEffect(() => {
    updateOwnerReadState(projectId)
  }, [projectId])

  function handleScroll() {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    autoScrollRef.current = distanceFromBottom < 120
  }

  useEffect(() => {
    const channel = supabase
      .channel(getPortalChatChannel(projectId), {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: PORTAL_CHAT_EVENT }, ({ payload }) => {
        const incoming = (payload as { message?: Message }).message
        if (!incoming) return
        if (incoming.project_id !== projectId) return

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === incoming.id)) return prev
          return [...prev, incoming]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, projectId])

  async function handleSend() {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const result = await postOwnerMessage(projectId, newMessage)

      if (result.success) {
        setMessages((prev) => [...prev, result.message])
        setNewMessage('')
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portal Chat</h1>
          <p className="text-muted-foreground">
            {projectName} &bull; {clientName}
          </p>
        </div>
      </div>

      {/* Chat container */}
      <Card className="flex flex-col h-[calc(100vh-16rem)]">
        <CardHeader className="border-b py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <CardTitle className="text-base">Messages</CardTitle>
          </div>
          <CardDescription>
            Chat with {clientUserName || clientName}
          </CardDescription>
        </CardHeader>

        {/* Messages */}
        <CardContent
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation with your client</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.author_type === 'owner' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg px-4 py-2',
                    message.author_type === 'owner'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.author_type === 'owner'
                      ? 'You'
                      : clientUserName || clientName}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      message.author_type === 'owner'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[80px] resize-none"
            disabled={sending}
            maxLength={MAX_MESSAGE_LENGTH}
          />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  )
}
