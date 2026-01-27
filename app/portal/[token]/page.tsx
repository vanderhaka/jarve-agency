import { getPortalManifest, getPortalMessages, getContractDocs, getClientUploads } from '@/lib/integrations/portal'
import { redirect } from 'next/navigation'
import { PortalTabs } from './components/portal-tabs'
import { PortalOverview } from './components/portal-overview'
import { ChatInterface } from './components/chat-interface'
import { DocsVault } from './components/docs-vault'
import { UploadsManager } from './components/uploads-manager'

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
  const firstProjectId = manifest.projects[0]?.id ?? null

  // Fetch all initial data in parallel
  const [messagesResult, docsResult, uploadsResult] = await Promise.all([
    firstProjectId ? getPortalMessages(token, firstProjectId, 100) : Promise.resolve({ success: false, messages: [] }),
    firstProjectId ? getContractDocs(token, firstProjectId) : Promise.resolve({ success: false, docs: [] }),
    firstProjectId ? getClientUploads(token, firstProjectId) : Promise.resolve({ success: false, uploads: [] }),
  ])

  const initialMessages = messagesResult.success ? messagesResult.messages : []
  const initialDocs = docsResult.success ? docsResult.docs : []
  const initialUploads = uploadsResult.success ? uploadsResult.uploads : []

  // Get last 3 messages for overview
  const latestMessages = initialMessages.slice(-3)

  return (
    <PortalTabs
      initialMessages={initialMessages}
      initialDocs={initialDocs}
      initialUploads={initialUploads}
      initialProjectId={firstProjectId}
    >
      {{
        overview: <PortalOverview latestMessages={latestMessages} />,
        messages: <ChatInterface initialMessages={initialMessages} initialProjectId={firstProjectId} />,
        documents: <DocsVault initialDocs={initialDocs} initialProjectId={firstProjectId} />,
        uploads: <UploadsManager initialUploads={initialUploads} initialProjectId={firstProjectId} />,
      }}
    </PortalTabs>
  )
}
