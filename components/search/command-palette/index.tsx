'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalSearch } from '../global-search-provider'
import { useRecentItems, type RecentItem } from '@/hooks/use-recent-items'
import { useSearchHistory } from '@/hooks/use-search-history'
import { useFavorites } from '@/hooks/use-favorites'
import { usePageContext } from '@/hooks/use-page-context'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandSeparator,
} from '@/components/terra-flow/ui/command'
import { Loader2 } from 'lucide-react'
import { useSearch } from './hooks/use-search'
import { useShortcuts } from './hooks/use-shortcuts'
import { SearchResults } from './search-results'
import { QuickActions } from './quick-actions'
import { NavigationGroup } from './navigation-group'
import { SmartViews } from './smart-views'

interface CommandPaletteProps {
  onCreateLead?: () => void
  onCreateClient?: () => void
  onCreateProject?: () => void
}

export function CommandPalette(_props: CommandPaletteProps) {
  const { isOpen, searchMode, closeSearch } = useGlobalSearch()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Custom hooks
  const { results, isLoading, isIdSearch } = useSearch(search)
  const { recentItems, addRecentItem } = useRecentItems()
  const { searchHistory, addSearch, removeSearch } = useSearchHistory()
  const { favorites, isLoading: favoritesLoading } = useFavorites()
  const { actions: contextActions, relatedItems, entityType, isDetailPage } = usePageContext()

  // Focus create section when opened in create mode
  useEffect(() => {
    if (isOpen && searchMode === 'create') {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, searchMode])

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
    },
    [closeSearch, router, addRecentItem, addSearch, search]
  )

  const handleAction = useCallback(
    (action: string) => {
      closeSearch()
      setSearch('')

      // Dispatch custom event for dialog triggers
      window.dispatchEvent(new CustomEvent('command-palette-action', { detail: { action } }))
    },
    [closeSearch]
  )

  const handleContextAction = useCallback(
    (actionId: string) => {
      closeSearch()
      setSearch('')

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
      }
    },
    [closeSearch]
  )

  // Single-key shortcuts handler
  useShortcuts(isOpen, search, handleAction, handleSelect)

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

        {/* Search Results */}
        {hasSearchResults && (
          <SearchResults
            results={results}
            isLoading={isLoading}
            isIdSearch={isIdSearch}
            search={search}
            onSelect={handleSelect}
          />
        )}

        {/* Quick Actions - shown when not searching */}
        {showQuickActions && !isLoading && (
          <>
            {/* Smart Views (Favorites, Recent, Context, Related) */}
            <SmartViews
              favorites={favorites}
              favoritesLoading={favoritesLoading}
              recentItems={recentItems}
              contextActions={contextActions}
              relatedItems={relatedItems}
              searchHistory={searchHistory}
              entityType={entityType || undefined}
              isDetailPage={isDetailPage}
              onSelect={handleSelect}
              onContextAction={handleContextAction}
              onSearchHistorySelect={handleSearchHistorySelect}
              onRemoveSearchHistory={handleRemoveSearchHistory}
            />

            {/* Create Actions */}
            <QuickActions
              showCreateMode={showCreateMode}
              onAction={handleAction}
              onSelect={handleSelect}
            />

            <CommandSeparator />

            {/* Navigation */}
            <NavigationGroup onSelect={handleSelect} />
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
