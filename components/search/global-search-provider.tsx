'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type SearchMode = 'default' | 'create'

interface GlobalSearchContextType {
  isOpen: boolean
  searchMode: SearchMode
  openSearch: (mode?: SearchMode) => void
  closeSearch: () => void
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined)

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.contentEditable === 'true'
  )
}

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>('default')

  const openSearch = useCallback((mode: SearchMode = 'default') => {
    setSearchMode(mode)
    setIsOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsOpen(false)
    setSearchMode('default')
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (isInputElement(e.target)) return

      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
        return
      }

      // Single key shortcuts (only when not in input)
      switch (e.key) {
        case '/':
          // Open search
          e.preventDefault()
          openSearch()
          break
        case 'n':
          // Open create menu
          e.preventDefault()
          openSearch('create')
          break
        // Note: ? and Escape are handled by KeyboardShortcutsModal
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openSearch])

  return (
    <GlobalSearchContext.Provider value={{ isOpen, searchMode, openSearch, closeSearch }}>
      {children}
    </GlobalSearchContext.Provider>
  )
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider')
  }
  return context
}
