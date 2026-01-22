import { redirect } from 'next/navigation'

export default async function AppCatchAllRedirect({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const path = slug ? `/admin/${slug.join('/')}` : '/admin'
  redirect(path)
}
