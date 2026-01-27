'use client'

import { useEffect } from 'react'

interface ShortcutAction {
  action?: string
  href?: string
}

const createShortcuts: Record<string, ShortcutAction> = {
  'L': { action: 'create-lead' },
  'C': { action: 'create-client' },
  'P': { action: 'create-project' },
  'O': { href: '/admin/proposals/new' },
}

export function useShortcuts(
  isOpen: boolean,
  search: string,
  onAction: (action: string) => void,
  onNavigate: (href: string) => void
) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle single-key shortcuts when search is empty
      if (search.length > 0) return

      // Don't trigger if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toUpperCase()

      if (createShortcuts[key]) {
        e.preventDefault()
        const shortcut = createShortcuts[key]
        if (shortcut.href) {
          onNavigate(shortcut.href)
        } else if (shortcut.action) {
          onAction(shortcut.action)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, search, onAction, onNavigate])
}
