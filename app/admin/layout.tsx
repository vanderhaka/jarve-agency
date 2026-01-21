import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserNav } from '@/components/user-nav'

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
        <nav className="flex gap-4 mb-8 border-b">
          <Link
            href="/app"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/app/leads"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Leads
          </Link>
          <Link
            href="/app/projects"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/app/clients"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Clients
          </Link>
          <Link
            href="/app/tasks"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            My Tasks
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Admin
          </Link>
          <Link
            href="/admin/employees"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Team
          </Link>
          <Link
            href="/admin/audit"
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
          >
            Audit Trails
          </Link>
        </nav>
        {children}
      </div>
    </div>
  )
}
