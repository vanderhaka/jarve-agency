'use client'

import { NavLink } from './nav-link'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCircle,
  CheckSquare,
  Shield,
  FileText,
  Search,
} from 'lucide-react'
import { Button } from '@/components/terra-flow/ui/button'
import { Kbd } from '@/components/terra-flow/ui/kbd'
import { useGlobalSearch } from '@/components/search/global-search-provider'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useRouter } from 'next/navigation'

interface UnifiedNavProps {
  isAdmin?: boolean
}

export function UnifiedNav({ isAdmin = false }: UnifiedNavProps) {
  const { openSearch } = useGlobalSearch()
  const router = useRouter()

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    combos: [
      { keys: ['g', 'd'], handler: () => router.push('/admin') },
      { keys: ['g', 'l'], handler: () => router.push('/app/leads') },
      { keys: ['g', 'p'], handler: () => router.push('/app/projects') },
      { keys: ['g', 'c'], handler: () => router.push('/app/clients') },
      { keys: ['g', 't'], handler: () => router.push('/app/tasks') },
      ...(isAdmin
        ? [
            { keys: ['g', 'm'], handler: () => router.push('/admin/employees') },
            { keys: ['g', 'a'], handler: () => router.push('/admin/audit') },
          ]
        : []),
    ],
  })

  return (
    <nav className="flex gap-4 mb-8 border-b">
      <div className="flex items-center gap-4 flex-1">
        {/* Standard navigation items for all users */}
        <NavLink href="/app" icon={LayoutDashboard}>
          Dashboard
        </NavLink>
        <NavLink href="/app/leads" icon={Users}>
          Leads
        </NavLink>
        <NavLink href="/app/projects" icon={Briefcase}>
          Projects
        </NavLink>
        <NavLink href="/app/clients" icon={UserCircle}>
          Clients
        </NavLink>
        <NavLink href="/app/tasks" icon={CheckSquare}>
          My Tasks
        </NavLink>

        {/* Admin-only items with visual separator */}
        {isAdmin && (
          <>
            <div className="border-l border-border mx-2" />
            <NavLink href="/admin/employees" icon={Shield}>
              Team
            </NavLink>
            <NavLink href="/admin/audit" icon={FileText}>
              Activity Log
            </NavLink>
          </>
        )}
      </div>

      {/* Search trigger */}
      <div className="flex items-center pb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openSearch}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <Kbd className="hidden md:inline-flex">⌘K</Kbd>
        </Button>
      </div>
    </nav>
  )
}
