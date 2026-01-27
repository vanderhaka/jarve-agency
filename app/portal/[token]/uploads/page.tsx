import { redirect } from 'next/navigation'

interface UploadsPageProps {
  params: Promise<{ token: string }>
}

export default async function UploadsPage({ params }: UploadsPageProps) {
  const { token } = await params
  // Redirect to main portal - tabs handle navigation now
  redirect(`/portal/${token}`)
}
