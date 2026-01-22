'use client'

import { useEffect, useRef, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  handler: () => void
  description?: string
}

interface KeyComboShortcut {
  keys: string[]
  handler: () => void
  description?: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts?: KeyboardShortcut[]
  combos?: KeyComboShortcut[]
  enabled?: boolean
}

const COMBO_TIMEOUT = 1000 // 1 second to complete a combo

export function useKeyboardShortcuts({
  shortcuts = [],
  combos = [],
  enabled = true,
}: UseKeyboardShortcutsOptions = {}) {
  const comboStateRef = useRef<{
    keys: string[]
    timeout: NodeJS.Timeout | null
  }>({
    keys: [],
    timeout: null,
  })

  const resetCombo = useCallback(() => {
    if (comboStateRef.current.timeout) {
      clearTimeout(comboStateRef.current.timeout)
    }
    comboStateRef.current = {
      keys: [],
      timeout: null,
    }
  }, [])

  const handleComboKey = useCallback(
    (key: string) => {
      const state = comboStateRef.current

      // Clear existing timeout
      if (state.timeout) {
        clearTimeout(state.timeout)
      }

      // Add key to combo
      state.keys.push(key)

      // Check if any combo matches
      const matchedCombo = combos.find((combo) => {
        if (combo.keys.length !== state.keys.length) return false
        return combo.keys.every((k, i) => k === state.keys[i])
      })

      if (matchedCombo) {
        matchedCombo.handler()
        resetCombo()
        return true
      }

      // Set timeout to reset combo
      state.timeout = setTimeout(resetCombo, COMBO_TIMEOUT)

      // Check if this could be the start of any combo
      const couldBeCombo = combos.some((combo) => {
        return combo.keys
          .slice(0, state.keys.length)
          .every((k, i) => k === state.keys[i])
      })

      if (!couldBeCombo) {
        resetCombo()
      }

      return false
    },
    [combos, resetCombo]
  )

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'

      if (isInput) return

      const key = event.key.toLowerCase()

      // Try combo first
      if (handleComboKey(key)) {
        event.preventDefault()
        return
      }

      // Try single-key shortcuts
      const shortcut = shortcuts.find((s) => s.key === key)
      if (shortcut) {
        event.preventDefault()
        shortcut.handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      resetCombo()
    }
  }, [enabled, shortcuts, handleComboKey, resetCombo])

  return { resetCombo }
}
