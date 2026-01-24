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
  let initialMessages: { id: string; author_type: string; body: string; created_at: string }[] = []
  if (manifest.projects.length > 0) {
    const messagesResult = await getPortalMessages(token, manifest.projects[0].id, 100)
    if (messagesResult.success) {
      initialMessages = messagesResult.messages
    }
  }

  return <ChatInterface initialMessages={initialMessages} />
}
