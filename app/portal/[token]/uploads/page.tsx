import { getPortalManifest, getClientUploads } from '@/lib/integrations/portal'
import { redirect } from 'next/navigation'
import { UploadsManager } from '../components/uploads-manager'

interface UploadsPageProps {
  params: Promise<{ token: string }>
}

export default async function UploadsPage({ params }: UploadsPageProps) {
  const { token } = await params

  const result = await getPortalManifest(token)

  if (!result.success) {
    redirect('/revoked')
  }

  const { manifest } = result

  // Get uploads for the first project
  let uploads: {
    id: string
    file_name: string
    file_size: number | null
    mime_type: string | null
    uploaded_by_type: string
    created_at: string
  }[] = []
  if (manifest.projects.length > 0) {
    const uploadsResult = await getClientUploads(token, manifest.projects[0].id)
    if (uploadsResult.success) {
      uploads = uploadsResult.uploads
    }
  }

  return <UploadsManager initialUploads={uploads} />
}
