'use client'

import { useCallback, useSyncExternalStore } from 'react'

export interface RecentItem {
  id: string
  name: string
  type: 'lead' | 'client' | 'project' | 'employee'
  href: string
  subtitle?: string
  viewedAt: number
}

const STORAGE_KEY = 'jarve-recent-items'
const MAX_ITEMS = 10

// Cache for getSnapshot - must return same reference if data unchanged
let cachedRaw: string | null = null
let cachedParsed: RecentItem[] = []

// Parse localStorage value safely
function parseStorageValue(value: string | null): RecentItem[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is RecentItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.type === 'string' &&
        typeof item.href === 'string' &&
        typeof item.viewedAt === 'number'
    )
  } catch {
    return []
  }
}

// Get current value from localStorage (cached to avoid infinite loops)
function getSnapshot(): RecentItem[] {
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
function getServerSnapshot(): RecentItem[] {
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
  window.addEventListener('recent-items-updated', handleCustom)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('recent-items-updated', handleCustom)
  }
}

// Helper to update localStorage and trigger re-render
function updateStorage(items: RecentItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('recent-items-updated'))
  } catch {
    console.warn('Failed to save recent items to localStorage')
  }
}

export function useRecentItems() {
  const recentItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const addRecentItem = useCallback(
    (item: Omit<RecentItem, 'viewedAt'>) => {
      const current = getSnapshot()

      // Remove existing entry for this item (by id and type)
      const filtered = current.filter(
        (existing) => !(existing.id === item.id && existing.type === item.type)
      )

      // Add to front with current timestamp
      const newItem: RecentItem = {
        ...item,
        viewedAt: Date.now(),
      }

      // Limit to MAX_ITEMS and update
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS)
      updateStorage(updated)
    },
    []
  )

  const removeRecentItem = useCallback((id: string, type: string) => {
    const current = getSnapshot()
    const updated = current.filter((item) => !(item.id === id && item.type === type))
    updateStorage(updated)
  }, [])

  const clearRecentItems = useCallback(() => {
    updateStorage([])
  }, [])

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
    isLoaded: true,
  }
}
