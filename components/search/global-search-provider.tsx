'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface GlobalSearchContextType {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined)

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = () => setIsOpen(true)
  const closeSearch = () => setIsOpen(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch }}>
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
