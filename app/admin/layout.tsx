import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserNav } from '@/components/user-nav'
import { UnifiedNav } from '@/components/navigation/unified-nav'
import { GlobalSearchProvider } from '@/components/search/global-search-provider'
import { CommandPalette } from '@/components/search/command-palette'
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts-modal'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('name, email, role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee || employee.role !== 'admin') {
    redirect('/app')
  }

  return (
    <GlobalSearchProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/app" className="text-2xl font-bold">
              JARVE CRM
            </Link>
            <UserNav user={user} employee={employee || undefined} />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <UnifiedNav isAdmin={true} />
          {children}
        </div>
      </div>
      <CommandPalette />
      <KeyboardShortcutsModal isAdmin={true} />
    </GlobalSearchProvider>
  )
}
