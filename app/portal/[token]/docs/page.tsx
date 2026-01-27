import { redirect } from 'next/navigation'

interface DocsPageProps {
  params: Promise<{ token: string }>
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { token } = await params
  // Redirect to main portal - tabs handle navigation now
  redirect(`/portal/${token}`)
}
