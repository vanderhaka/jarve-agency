'use client'

import { useState, useEffect } from 'react'

export interface SearchResult {
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

export function useSearch(search: string) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isIdSearch, setIsIdSearch] = useState(false)

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

  return { results, isLoading, isIdSearch }
}
