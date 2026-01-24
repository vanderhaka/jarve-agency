import { redirect } from 'next/navigation'
import { getPortalManifest } from '@/lib/integrations/portal'
import { PortalNav } from './components/portal-nav'
import { PortalProvider } from './components/portal-context'

interface PortalLayoutProps {
  children: React.ReactNode
  params: Promise<{ token: string }>
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { token } = await params

  // Validate token and get manifest
  const result = await getPortalManifest(token)

  if (!result.success) {
    redirect('/revoked')
  }

  const { manifest } = result

  return (
    <PortalProvider manifest={manifest} token={token}>
      <div className="min-h-screen bg-background">
        <PortalNav />
        <main className="container mx-auto px-4 py-6 max-w-5xl">
          {children}
        </main>
      </div>
    </PortalProvider>
  )
}
