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
} from '@/components/terra-flow/ui/command'
import { Users, UserCircle, Briefcase, Shield, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  subtitle: string
  type: 'lead' | 'client' | 'project' | 'employee'
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
}

const typeLabels = {
  lead: 'Leads',
  client: 'Clients',
  project: 'Projects',
  employee: 'Team',
}

export function CommandPalette() {
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

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search for leads, clients, projects, and team members"
    >
      <CommandInput
        placeholder="Search for leads, clients, projects, or team members..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && search && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!isLoading &&
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
                    <div className="flex flex-col">
                      <span>{result.name}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
      </CommandList>
    </CommandDialog>
  )
}
