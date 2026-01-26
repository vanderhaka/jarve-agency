import { getPortalManifest, getPortalMessages } from '@/lib/integrations/portal'
import { redirect } from 'next/navigation'
import { ChatInterface } from '../components/chat-interface'

interface ChatPageProps {
  params: Promise<{ token: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { token } = await params

  const result = await getPortalManifest(token)

  if (!result.success) {
    redirect('/revoked')
  }

  const { manifest } = result

  // Get messages for the first project
  const firstProjectId = manifest.projects[0]?.id || null
  let initialMessages: { id: string; author_type: string; body: string; created_at: string }[] = []
  if (firstProjectId) {
    const messagesResult = await getPortalMessages(token, firstProjectId, 100)
    if (messagesResult.success) {
      initialMessages = messagesResult.messages
    }
  }

  return <ChatInterface initialMessages={initialMessages} initialProjectId={firstProjectId} />
}
