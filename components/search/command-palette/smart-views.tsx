'use client'

import { CommandGroup, CommandItem, CommandSeparator } from '@/components/terra-flow/ui/command'
import { Star, History, Link2, Zap, ArrowRight, Mail, Clock, AlertCircle, FileSignature, X } from 'lucide-react'
import type { RecentItem } from '@/hooks/use-recent-items'
import type { Favorite } from '@/hooks/use-favorites'
import type { SearchHistoryEntry } from '@/hooks/use-search-history'
import type { ContextualAction, RelatedItem } from '@/hooks/use-page-context'
import { typeIcons } from './constants'

const smartViewsData = [
  { id: 'view-new-leads', label: 'New Leads', href: '/app/leads?status=new', icon: Mail, description: 'Uncontacted leads' },
  { id: 'view-my-tasks', label: 'Tasks Due Today', href: '/app/tasks?due=today', icon: Clock, description: 'Your tasks due today' },
  { id: 'view-overdue', label: 'Overdue Tasks', href: '/app/tasks?due=overdue', icon: AlertCircle, description: 'Past due tasks' },
  { id: 'view-pending-proposals', label: 'Pending Proposals', href: '/admin/proposals?status=pending', icon: FileSignature, description: 'Awaiting response' },
]

interface SmartViewsProps {
  favorites: Favorite[]
  favoritesLoading: boolean
  recentItems: RecentItem[]
  contextActions: ContextualAction[]
  relatedItems: RelatedItem[]
  searchHistory: SearchHistoryEntry[]
  entityType?: string
  isDetailPage: boolean
  onSelect: (href: string, item?: { id: string; name: string; type: string; subtitle?: string }) => void
  onContextAction: (actionId: string) => void
  onSearchHistorySelect: (query: string) => void
  onRemoveSearchHistory: (e: React.MouseEvent, query: string) => void
}

export function SmartViews({
  favorites,
  favoritesLoading,
  recentItems,
  contextActions,
  relatedItems,
  searchHistory,
  entityType,
  isDetailPage,
  onSelect,
  onContextAction,
  onSearchHistorySelect,
  onRemoveSearchHistory,
}: SmartViewsProps) {
  return (
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
                  onSelect={() => onSelect(href, {
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
                  onSelect={() => onSelect(item.href, {
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
                  onSelect={() => onContextAction(action.id)}
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
                  onSelect={() => onSelect(item.href, {
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

      {/* Smart Views Group */}
      <CommandGroup heading="Smart Views">
        {smartViewsData.map(item => {
          const Icon = item.icon
          return (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.description}`}
              onSelect={() => onSelect(item.href)}
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

      {/* Recent Searches */}
      {searchHistory.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Recent Searches">
            {searchHistory.map(entry => (
              <CommandItem
                key={entry.timestamp}
                value={`search history ${entry.query}`}
                onSelect={() => onSearchHistorySelect(entry.query)}
              >
                <History className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{entry.query}</span>
                <button
                  className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
                  onClick={(e) => onRemoveSearchHistory(e, entry.query)}
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
  )
}
