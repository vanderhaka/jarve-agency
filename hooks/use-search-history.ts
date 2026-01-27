'use client'

import { useCallback, useSyncExternalStore } from 'react'

export interface SearchHistoryEntry {
  query: string
  timestamp: number
}

const STORAGE_KEY = 'jarve-search-history'
const MAX_ENTRIES = 5

// Cache for getSnapshot - must return same reference if data unchanged
let cachedRaw: string | null = null
let cachedParsed: SearchHistoryEntry[] = []

// Parse localStorage value safely
function parseStorageValue(value: string | null): SearchHistoryEntry[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is SearchHistoryEntry =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.query === 'string' &&
        typeof item.timestamp === 'number'
    )
  } catch {
    return []
  }
}

// Get current value from localStorage (cached to avoid infinite loops)
function getSnapshot(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return cachedParsed
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== cachedRaw) {
      cachedRaw = raw
      cachedParsed = parseStorageValue(raw)
    }
  } catch {
    // localStorage throws in iOS Safari private browsing mode
    return cachedParsed
  }
  return cachedParsed
}

// Server snapshot must be cached (stable reference) to avoid infinite loops
function getServerSnapshot(): SearchHistoryEntry[] {
  return cachedParsed
}

// Subscribe to storage events
function subscribe(callback: () => void): () => void {
  // Guard against SSR - useSyncExternalStore may call subscribe during hydration
  // iPad Safari has stricter hydration timing where window may not be available
  if (typeof window === 'undefined') return () => {}

  // Listen for storage events from other tabs
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback()
    }
  }
  window.addEventListener('storage', handleStorage)

  // Also create a custom event for same-tab updates
  const handleCustom = () => callback()
  window.addEventListener('search-history-updated', handleCustom)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('search-history-updated', handleCustom)
  }
}

// Helper to update localStorage and trigger re-render
function updateStorage(entries: SearchHistoryEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    window.dispatchEvent(new CustomEvent('search-history-updated'))
  } catch {
    console.warn('Failed to save search history to localStorage')
  }
}

export function useSearchHistory() {
  const searchHistory = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) return

    const current = getSnapshot()

    // Remove duplicate if exists (case-insensitive)
    const filtered = current.filter(
      (entry) => entry.query.toLowerCase() !== trimmed.toLowerCase()
    )

    // Add to front with current timestamp
    const newEntry: SearchHistoryEntry = {
      query: trimmed,
      timestamp: Date.now(),
    }

    // Limit to MAX_ENTRIES and update
    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES)
    updateStorage(updated)
  }, [])

  const removeSearch = useCallback((query: string) => {
    const current = getSnapshot()
    const updated = current.filter((entry) => entry.query !== query)
    updateStorage(updated)
  }, [])

  const clearHistory = useCallback(() => {
    updateStorage([])
  }, [])

  return {
    searchHistory,
    addSearch,
    removeSearch,
    clearHistory,
    isLoaded: true,
  }
}
