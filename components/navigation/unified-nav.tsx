'use client'

import { NavLink } from './nav-link'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCircle,
  CheckSquare,
  Shield,
  FileSignature,
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
      { keys: ['g', 'l'], handler: () => router.push('/admin/leads') },
      { keys: ['g', 'p'], handler: () => router.push('/admin/projects') },
      { keys: ['g', 'c'], handler: () => router.push('/admin/clients') },
      { keys: ['g', 't'], handler: () => router.push('/admin/tasks') },
      { keys: ['g', 'o'], handler: () => router.push('/admin/proposals') },
      ...(isAdmin
        ? [
            { keys: ['g', 'm'], handler: () => router.push('/admin/employees') },
          ]
        : []),
    ],
  })

  return (
    <nav className="flex gap-4 mb-8 items-center">
      <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide rounded-lg border border-gray-300 bg-white p-1 shadow dark:border-gray-700 dark:bg-gray-900">
        {/* Standard navigation items for all users */}
        <NavLink href="/admin" icon={LayoutDashboard}>
          Dashboard
        </NavLink>
        <NavLink href="/admin/leads" icon={Users}>
          Leads
        </NavLink>
        <NavLink href="/admin/projects" icon={Briefcase}>
          Projects
        </NavLink>
        <NavLink href="/admin/clients" icon={UserCircle}>
          Clients
        </NavLink>
        <NavLink href="/admin/tasks" icon={CheckSquare}>
          Tasks
        </NavLink>
        <NavLink href="/admin/proposals" icon={FileSignature}>
          Proposals
        </NavLink>

        {/* Admin-only items with visual separator */}
        {isAdmin && (
          <>
            <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-1" />
            <NavLink href="/admin/employees" icon={Shield}>
              Team
            </NavLink>
          </>
        )}
      </div>

      {/* Search trigger */}
      <div className="flex items-center">
        <Button
          size="sm"
          onClick={() => openSearch()}
          className="gap-2 bg-black text-white hover:bg-black/90"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <Kbd className="hidden md:inline-flex">⌘K</Kbd>
        </Button>
      </div>
    </nav>
  )
}
