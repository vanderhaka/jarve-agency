import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JARVE - v1',
  robots: 'noindex, nofollow',
}

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
