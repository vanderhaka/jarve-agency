'use client'

import { CommandGroup, CommandItem, CommandEmpty } from '@/components/terra-flow/ui/command'
import { ArrowRight, Hash } from 'lucide-react'
import type { SearchResult } from './hooks/use-search'
import { typeIcons, typeLabels } from './constants'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  isIdSearch: boolean
  search: string
  onSelect: (href: string, item?: { id: string; name: string; type: string; subtitle?: string }) => void
}

export function SearchResults({ results, isLoading, isIdSearch, search, onSelect }: SearchResultsProps) {
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

  const hasSearchResults = !isLoading && results.length > 0

  // ID Search Mode Hint
  if (isIdSearch && !isLoading && results.length === 0 && search.length > 1) {
    return (
      <CommandEmpty>
        <div className="flex flex-col items-center gap-2">
          <Hash className="h-8 w-8 text-muted-foreground" />
          <span>No entities found with ID starting with &quot;{search.slice(1)}&quot;</span>
          <span className="text-xs text-muted-foreground">Enter at least 4 characters of the UUID</span>
        </div>
      </CommandEmpty>
    )
  }

  if (!isLoading && search && !isIdSearch && results.length === 0) {
    return <CommandEmpty>No results found for &quot;{search}&quot;</CommandEmpty>
  }

  if (!hasSearchResults) {
    return null
  }

  return (
    <>
      {Object.entries(groupedResults).map(([type, items]) => {
        const Icon = typeIcons[type as keyof typeof typeIcons]
        const label = typeLabels[type as keyof typeof typeLabels]

        return (
          <CommandGroup key={type} heading={isIdSearch ? `${label} (ID Match)` : label}>
            {items.map(result => (
              <CommandItem
                key={result.id}
                value={`${result.name} ${result.subtitle}`}
                onSelect={() => onSelect(result.href, {
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
    </>
  )
}
