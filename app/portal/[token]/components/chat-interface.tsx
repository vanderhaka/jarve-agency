'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { usePortal } from './portal-context'
import { postPortalMessage, updateReadState, getPortalMessages } from '@/lib/integrations/portal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { getPortalChatChannel, PORTAL_CHAT_EVENT } from '@/lib/integrations/portal/realtime'

interface Message {
  id: string
  project_id: string
  author_type: string
  body: string
  created_at: string
}

interface ChatInterfaceProps {
  initialMessages: Message[]
  initialProjectId: string | null
}

const MAX_MESSAGE_LENGTH = 2000

export function ChatInterface({ initialMessages, initialProjectId }: ChatInterfaceProps) {
  const { token, selectedProject, manifest, setProjectUnread } = usePortal()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const currentProjectIdRef = useRef<string | null>(initialProjectId)
  const autoScrollRef = useRef(true)

  // Fetch messages when project changes
  useEffect(() => {
    if (!selectedProject) return
    
    const projectId = selectedProject.id
    
    // Skip if this is the initial project (data already loaded from server)
    if (projectId === currentProjectIdRef.current) return
    
    // Update ref immediately to track which project we're fetching for
    currentProjectIdRef.current = projectId
    
    async function fetchMessages() {
      setLoading(true)
      try {
        const result = await getPortalMessages(token, projectId, 100)
        // Check if this is still the current project before updating state
        if (currentProjectIdRef.current !== projectId) return
        if (result.success) {
          setMessages(result.messages)
        } else {
          toast.error(result.error || 'Failed to load messages')
        }
      } catch {
        // Check if this is still the current project before showing error
        if (currentProjectIdRef.current !== projectId) return
        toast.error('Failed to load messages')
      } finally {
        // Only update loading state if this is still the current project
        if (currentProjectIdRef.current === projectId) {
          setLoading(false)
        }
      }
    }
    
    fetchMessages()
  }, [token, selectedProject])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  function handleScroll() {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    autoScrollRef.current = distanceFromBottom < 120
  }

  // Mark messages as read when viewing
  useEffect(() => {
    if (selectedProject) {
      updateReadState(token, selectedProject.id)
        .then((result) => {
          if (result.success) {
            setProjectUnread(selectedProject.id, 0)
          }
        })
    }
  }, [token, selectedProject, setProjectUnread])

  // Subscribe to realtime chat updates for the selected project
  useEffect(() => {
    if (!selectedProject) return

    const channel = supabase
      .channel(getPortalChatChannel(selectedProject.id), {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: PORTAL_CHAT_EVENT }, ({ payload }) => {
        const incoming = (payload as { message?: Message }).message
        if (!incoming) return
        if (incoming.project_id !== selectedProject.id) return

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === incoming.id)) return prev
          return [...prev, incoming]
        })

        if (incoming.author_type === 'owner') {
          updateReadState(token, selectedProject.id)
            .then((result) => {
              if (result.success) {
                setProjectUnread(selectedProject.id, 0)
              }
            })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, selectedProject, token, setProjectUnread])

  async function handleSend() {
    if (!newMessage.trim() || !selectedProject) return

    setSending(true)
    try {
      const result = await postPortalMessage(token, selectedProject.id, newMessage)

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

  if (!selectedProject) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No project selected</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="pb-4 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">{selectedProject.name}</p>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.author_type === 'client' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-4 py-2',
                  message.author_type === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm font-medium mb-1">
                  {message.author_type === 'client'
                    ? manifest.clientUser.name
                    : 'JARVE Team'}
                </p>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    message.author_type === 'client'
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
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
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
    </div>
  )
}
