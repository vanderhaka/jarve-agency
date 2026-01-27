'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalSearch } from './global-search-provider'
import { useRecentItems, type RecentItem } from '@/hooks/use-recent-items'
import { useSearchHistory } from '@/hooks/use-search-history'
import { useFavorites } from '@/hooks/use-favorites'
import { usePageContext } from '@/hooks/use-page-context'
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
  Clock,
  AlertCircle,
  Mail,
  ArrowRight,
  Star,
  History,
  Hash,
  Link2,
  Zap,
  X,
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
  searchMode?: 'id' | 'text'
}

const typeIcons = {
  lead: Users,
  client: UserCircle,
  project: Briefcase,
  employee: Shield,
  milestone: Flag,
  change_request: FileEdit,
  proposal: FileSignature,
}

const typeLabels = {
  lead: 'Leads',
  client: 'Clients',
  project: 'Projects',
  employee: 'Team',
  milestone: 'Milestones',
  change_request: 'Change Requests',
  proposal: 'Proposals',
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

export function CommandPalette(_props: CommandPaletteProps) {
  const { isOpen, searchMode, closeSearch } = useGlobalSearch()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isIdSearch, setIsIdSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hooks for new features
  const { recentItems, addRecentItem } = useRecentItems()
  const { searchHistory, addSearch, removeSearch } = useSearchHistory()
  const { favorites, isLoading: favoritesLoading } = useFavorites()
  const { actions: contextActions, relatedItems, entityType, isDetailPage } = usePageContext()

  // Focus create section when opened in create mode
  useEffect(() => {
    if (isOpen && searchMode === 'create') {
      // Small delay to ensure dialog is rendered
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, searchMode])

  // Debounced search with AbortController to prevent race conditions
  useEffect(() => {
    if (!search || search.trim().length === 0) {
      setResults([])
      setIsIdSearch(false)
      return
    }

    const trimmedSearch = search.trim()
    const isIdMode = trimmedSearch.startsWith('#')
    setIsIdSearch(isIdMode)

    const abortController = new AbortController()

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedSearch)}`, {
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
    (href: string, item?: { id: string; name: string; type: string; subtitle?: string }) => {
      // Add to recent items if item info provided
      if (item && ['lead', 'client', 'project', 'employee'].includes(item.type)) {
        addRecentItem({
          id: item.id,
          name: item.name,
          type: item.type as RecentItem['type'],
          href,
          subtitle: item.subtitle,
        })
      }

      // Save search query to history
      if (search && search.trim().length >= 2 && !search.startsWith('#')) {
        addSearch(search.trim())
      }

      closeSearch()
      router.push(href)
      setSearch('')
      setResults([])
    },
    [closeSearch, router, addRecentItem, addSearch, search]
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

  // Single-key shortcuts when palette is open and no search query
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle single-key shortcuts when search is empty
      if (search.length > 0) return

      // Don't trigger if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toUpperCase()

      // Create shortcuts
      const createShortcuts: Record<string, { action?: string; href?: string }> = {
        'L': { action: 'create-lead' },
        'C': { action: 'create-client' },
        'P': { action: 'create-project' },
        'O': { href: '/admin/proposals/new' },
      }

      if (createShortcuts[key]) {
        e.preventDefault()
        const shortcut = createShortcuts[key]
        if (shortcut.href) {
          handleSelect(shortcut.href)
        } else if (shortcut.action) {
          handleAction(shortcut.action)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, search, handleSelect, handleAction])

  const handleContextAction = useCallback(
    (actionId: string) => {
      closeSearch()
      setSearch('')
      setResults([])

      // Dispatch contextual action event
      window.dispatchEvent(new CustomEvent('contextual-action', { detail: { action: actionId } }))
    },
    [closeSearch]
  )

  const handleSearchHistorySelect = useCallback(
    (query: string) => {
      setSearch(query)
    },
    []
  )

  const handleRemoveSearchHistory = useCallback(
    (e: React.MouseEvent, query: string) => {
      e.stopPropagation()
      removeSearch(query)
    },
    [removeSearch]
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
  const showCreateMode = searchMode === 'create' && showQuickActions

  // Determine placeholder text
  const placeholderText = isIdSearch
    ? 'Enter UUID fragment (e.g., #abc123)...'
    : 'Search, type # for ID lookup, or run a command...'

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Command Palette"
      description="Search or run quick actions"
    >
      <CommandInput
        ref={inputRef}
        placeholder={placeholderText}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ID Search Mode Hint */}
        {isIdSearch && !isLoading && results.length === 0 && search.length > 1 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2">
              <Hash className="h-8 w-8 text-muted-foreground" />
              <span>No entities found with ID starting with &quot;{search.slice(1)}&quot;</span>
              <span className="text-xs text-muted-foreground">Enter at least 4 characters of the UUID</span>
            </div>
          </CommandEmpty>
        )}

        {!isLoading && search && !isIdSearch && results.length === 0 && (
          <CommandEmpty>No results found for &quot;{search}&quot;</CommandEmpty>
        )}

        {/* Search Results */}
        {hasSearchResults &&
          Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons]
            const label = typeLabels[type as keyof typeof typeLabels]

            return (
              <CommandGroup key={type} heading={isIdSearch ? `${label} (ID Match)` : label}>
                {items.map(result => (
                  <CommandItem
                    key={result.id}
                    value={`${result.name} ${result.subtitle}`}
                    onSelect={() => handleSelect(result.href, {
                      id: result.id,
                      name: result.name,
                      type: result.type,
                      subtitle: result.subtitle,
                    })}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col flex-1">
                      <span>{result.name}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                      {isIdSearch && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {result.id.slice(0, 8)}...
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
            {/* Favorites Section */}
            {!favoritesLoading && favorites.length > 0 && (
              <>
                <CommandGroup heading="Favorites">
                  {favorites.slice(0, 5).map(fav => {
                    const Icon = typeIcons[fav.entityType as keyof typeof typeIcons]
                    const href = fav.entityType === 'employee'
                      ? `/admin/employees/${fav.entityId}`
                      : `/app/${fav.entityType}s/${fav.entityId}`
                    return (
                      <CommandItem
                        key={fav.id}
                        value={`favorite ${fav.entityName} ${fav.entitySubtitle}`}
                        onSelect={() => handleSelect(href, {
                          id: fav.entityId,
                          name: fav.entityName,
                          type: fav.entityType,
                          subtitle: fav.entitySubtitle,
                        })}
                      >
                        <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col flex-1">
                          <span>{fav.entityName}</span>
                          {fav.entitySubtitle && (
                            <span className="text-xs text-muted-foreground">{fav.entitySubtitle}</span>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Recent Items Section */}
            {recentItems.length > 0 && (
              <>
                <CommandGroup heading="Recent">
                  {recentItems.slice(0, 5).map(item => {
                    const Icon = typeIcons[item.type as keyof typeof typeIcons]
                    return (
                      <CommandItem
                        key={`recent-${item.id}-${item.type}`}
                        value={`recent ${item.name} ${item.subtitle}`}
                        onSelect={() => handleSelect(item.href, {
                          id: item.id,
                          name: item.name,
                          type: item.type,
                          subtitle: item.subtitle,
                        })}
                      >
                        <History className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col flex-1">
                          <span>{item.name}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Contextual Actions Section - only on detail pages */}
            {isDetailPage && entityType && contextActions.length > 0 && (
              <>
                <CommandGroup heading={`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Actions`}>
                  {contextActions.slice(0, 5).map(action => {
                    const Icon = action.icon
                    return (
                      <CommandItem
                        key={action.id}
                        value={`action ${action.label} ${action.description}`}
                        onSelect={() => handleContextAction(action.id)}
                        className={action.destructive ? 'text-destructive' : undefined}
                      >
                        <Zap className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Icon className={`mr-2 h-4 w-4 ${action.destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div className="flex flex-col flex-1">
                          <span>{action.label}</span>
                          {action.description && (
                            <span className="text-xs text-muted-foreground">{action.description}</span>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Related Items Section - only on detail pages */}
            {isDetailPage && relatedItems.length > 0 && (
              <>
                <CommandGroup heading="Related">
                  {relatedItems.slice(0, 5).map(item => {
                    const Icon = typeIcons[item.type as keyof typeof typeIcons]
                    return (
                      <CommandItem
                        key={`related-${item.id}-${item.type}`}
                        value={`related ${item.name} ${item.subtitle}`}
                        onSelect={() => handleSelect(item.href, {
                          id: item.id,
                          name: item.name,
                          type: item.type,
                          subtitle: item.subtitle,
                        })}
                      >
                        <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col flex-1">
                          <span>{item.name}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Create Actions - shown prominently in create mode */}
            <CommandGroup heading={showCreateMode ? 'Create New' : 'Create'}>
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

            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Recent Searches">
                  {searchHistory.map(entry => (
                    <CommandItem
                      key={entry.timestamp}
                      value={`search history ${entry.query}`}
                      onSelect={() => handleSearchHistorySelect(entry.query)}
                    >
                      <History className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{entry.query}</span>
                      <button
                        className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
                        onClick={(e) => handleRemoveSearchHistory(e, entry.query)}
                        aria-label="Remove from history"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
