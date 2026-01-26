'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/terra-flow/ui/dialog'
import { Kbd, KbdGroup } from '@/components/terra-flow/ui/kbd'

interface Shortcut {
  keys: string[]
  description: string
  category: string
  adminOnly?: boolean
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['g', 'd'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['g', 'l'], description: 'Go to Leads', category: 'Navigation' },
  { keys: ['g', 'p'], description: 'Go to Projects', category: 'Navigation' },
  { keys: ['g', 'c'], description: 'Go to Clients', category: 'Navigation' },
  { keys: ['g', 't'], description: 'Go to My Tasks', category: 'Navigation' },
  { keys: ['g', 'o'], description: 'Go to Proposals', category: 'Navigation' },
  {
    keys: ['g', 'm'],
    description: 'Go to Team Management',
    category: 'Navigation',
    adminOnly: true,
  },
  {
    keys: ['g', 'a'],
    description: 'Go to Activity Log',
    category: 'Navigation',
    adminOnly: true,
  },
  // Search
  { keys: ['⌘', 'k'], description: 'Open search', category: 'Search' },
  { keys: ['ctrl', 'k'], description: 'Open search (Windows/Linux)', category: 'Search' },
  // Help
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Help' },
]

interface KeyboardShortcutsModalProps {
  isAdmin?: boolean
}

export function KeyboardShortcutsModal({ isAdmin = false }: KeyboardShortcutsModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger when typing in inputs
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'

      if (isInput) return

      // Open modal on "?" key (requires Shift on most keyboards)
      if (event.key === '?') {
        event.preventDefault()
        setIsOpen(true)
      }

      // Close on Escape
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Group shortcuts by category
  const categories = SHORTCUTS.reduce(
    (acc, shortcut) => {
      // Filter out admin-only shortcuts if user is not admin
      if (shortcut.adminOnly && !isAdmin) return acc

      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, Shortcut[]>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(categories).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <KbdGroup>
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="inline-flex items-center gap-1">
                          {keyIndex > 0 && (
                            <span className="text-muted-foreground text-xs">then</span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </KbdGroup>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>
            Press <Kbd className="inline-flex">Esc</Kbd> or click outside to close this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
