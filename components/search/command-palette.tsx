'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalSearch } from './global-search-provider'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/terra-flow/ui/command'
import {
  Users,
  UserCircle,
  Briefcase,
  Shield,
  Loader2,
  Flag,
  FileEdit,
  Plus,
  LayoutDashboard,
  CheckSquare,
  FileSignature,
  FileText,
  Search,
  Clock,
  AlertCircle,
  Mail,
  ArrowRight,
} from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  subtitle: string
  type: 'lead' | 'client' | 'project' | 'employee' | 'milestone' | 'change_request'
  href: string
}

interface SearchResponse {
  results: SearchResult[]
}

const typeIcons = {
  lead: Users,
  client: UserCircle,
  project: Briefcase,
  employee: Shield,
  milestone: Flag,
  change_request: FileEdit,
}

const typeLabels = {
  lead: 'Leads',
  client: 'Clients',
  project: 'Projects',
  employee: 'Team',
  milestone: 'Milestones',
  change_request: 'Change Requests',
}

// Quick actions configuration
const quickActions = {
  create: [
    { id: 'new-lead', label: 'New Lead', icon: Users, action: 'create-lead', shortcut: 'L' },
    { id: 'new-client', label: 'New Client', icon: UserCircle, action: 'create-client', shortcut: 'C' },
    { id: 'new-project', label: 'New Project', icon: Briefcase, action: 'create-project', shortcut: 'P' },
    { id: 'new-proposal', label: 'New Proposal', href: '/admin/proposals/new', icon: FileSignature, shortcut: 'O' },
  ],
  navigate: [
    { id: 'nav-dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard, shortcut: 'G D' },
    { id: 'nav-leads', label: 'Leads', href: '/app/leads', icon: Users, shortcut: 'G L' },
    { id: 'nav-projects', label: 'Projects', href: '/app/projects', icon: Briefcase, shortcut: 'G P' },
    { id: 'nav-clients', label: 'Clients', href: '/app/clients', icon: UserCircle, shortcut: 'G C' },
    { id: 'nav-tasks', label: 'My Tasks', href: '/app/tasks', icon: CheckSquare, shortcut: 'G T' },
    { id: 'nav-proposals', label: 'Proposals', href: '/admin/proposals', icon: FileSignature, shortcut: 'G O' },
    { id: 'nav-team', label: 'Team', href: '/admin/employees', icon: Shield, shortcut: 'G M' },
    { id: 'nav-activity', label: 'Activity Log', href: '/admin/audit', icon: FileText, shortcut: 'G A' },
  ],
  smartViews: [
    { id: 'view-new-leads', label: 'New Leads', href: '/app/leads?status=new', icon: Mail, description: 'Uncontacted leads' },
    { id: 'view-my-tasks', label: 'Tasks Due Today', href: '/app/tasks?due=today', icon: Clock, description: 'Your tasks due today' },
    { id: 'view-overdue', label: 'Overdue Tasks', href: '/app/tasks?due=overdue', icon: AlertCircle, description: 'Past due tasks' },
    { id: 'view-pending-proposals', label: 'Pending Proposals', href: '/admin/proposals?status=pending', icon: FileSignature, description: 'Awaiting response' },
  ],
}

interface CommandPaletteProps {
  onCreateLead?: () => void
  onCreateClient?: () => void
  onCreateProject?: () => void
}

export function CommandPalette({ onCreateLead, onCreateClient, onCreateProject }: CommandPaletteProps) {
  const { isOpen, closeSearch } = useGlobalSearch()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Debounced search with AbortController to prevent race conditions
  useEffect(() => {
    if (!search || search.trim().length === 0) {
      setResults([])
      return
    }

    const abortController = new AbortController()

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(search)}`, {
          signal: abortController.signal,
        })
        if (!response.ok) {
          console.error('Search request failed:', response.status)
          setResults([])
          return
        }
        const data: SearchResponse = await response.json()
        setResults(data.results || [])
      } catch (error) {
        // Ignore abort errors - they're expected when user types quickly
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      abortController.abort()
    }
  }, [search])

  const handleSelect = useCallback(
    (href: string) => {
      closeSearch()
      router.push(href)
      setSearch('')
      setResults([])
    },
    [closeSearch, router]
  )

  const handleAction = useCallback(
    (action: string) => {
      closeSearch()
      setSearch('')
      setResults([])

      // Dispatch custom event for dialog triggers
      window.dispatchEvent(new CustomEvent('command-palette-action', { detail: { action } }))
    },
    [closeSearch]
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeSearch()
        setSearch('')
        setResults([])
      }
    },
    [closeSearch]
  )

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  const showQuickActions = !search || search.trim().length === 0
  const hasSearchResults = !isLoading && results.length > 0

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Command Palette"
      description="Search or run quick actions"
    >
      <CommandInput
        placeholder="Search or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && search && results.length === 0 && (
          <CommandEmpty>No results found for &quot;{search}&quot;</CommandEmpty>
        )}

        {/* Search Results */}
        {hasSearchResults &&
          Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons]
            const label = typeLabels[type as keyof typeof typeLabels]

            return (
              <CommandGroup key={type} heading={label}>
                {items.map(result => (
                  <CommandItem
                    key={result.id}
                    value={`${result.name} ${result.subtitle}`}
                    onSelect={() => handleSelect(result.href)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col flex-1">
                      <span>{result.name}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}

        {/* Quick Actions - shown when not searching */}
        {showQuickActions && !isLoading && (
          <>
            {/* Create Actions */}
            <CommandGroup heading="Create">
              {quickActions.create.map(item => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => item.href ? handleSelect(item.href) : handleAction(item.action!)}
                  >
                    <div className="mr-2 h-6 w-6 rounded-md bg-muted flex items-center justify-center">
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
                      {item.shortcut}
                    </kbd>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            {/* Smart Views */}
            <CommandGroup heading="Smart Views">
              {quickActions.smartViews.map(item => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.description}`}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1">
                      <span>{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            {/* Navigation */}
            <CommandGroup heading="Go to">
              {quickActions.navigate.map(item => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 hidden sm:inline-flex">
                      {item.shortcut}
                    </kbd>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
