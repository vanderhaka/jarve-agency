import { getPortalManifest, getContractDocs } from '@/lib/integrations/portal'
import { redirect } from 'next/navigation'
import { DocsVault } from '../components/docs-vault'

interface DocsPageProps {
  params: Promise<{ token: string }>
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { token } = await params

  const result = await getPortalManifest(token)

  if (!result.success) {
    redirect('/revoked')
  }

  const { manifest } = result

  // Get contract docs for the first project
  const firstProjectId = manifest.projects[0]?.id || null
  let docs: { id: string; name: string; type: string; created_at: string; signed_at: string | null }[] = []
  if (firstProjectId) {
    const docsResult = await getContractDocs(token, firstProjectId)
    if (docsResult.success) {
      docs = docsResult.docs
    }
  }

  return <DocsVault initialDocs={docs} initialProjectId={firstProjectId} />
}
