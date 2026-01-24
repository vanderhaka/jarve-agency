import { getPortalManifest, getPortalMessages } from '@/lib/integrations/portal'
import { redirect } from 'next/navigation'
import { PortalHome } from './components/portal-home'

interface PortalPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params

  const result = await getPortalManifest(token)

  if (!result.success) {
    redirect('/revoked')
  }

  const { manifest } = result

  // Get latest messages for the first project (if any)
  let latestMessages: { author_type: string; body: string; created_at: string }[] = []
  if (manifest.projects.length > 0) {
    const messagesResult = await getPortalMessages(token, manifest.projects[0].id, 3)
    if (messagesResult.success) {
      latestMessages = messagesResult.messages.slice(-3)
    }
  }

  return <PortalHome latestMessages={latestMessages} />
}
