import { redirect } from 'next/navigation'

interface ChatPageProps {
  params: Promise<{ token: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { token } = await params
  // Redirect to main portal - tabs handle navigation now
  redirect(`/portal/${token}`)
}
