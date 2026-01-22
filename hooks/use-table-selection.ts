'use client'

import { useState, useCallback } from 'react'

export function useTableSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  const toggle = useCallback((id: string, index?: number, allIds?: string[], shiftKey?: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)

      // Handle shift-click range selection
      if (
        index !== undefined &&
        lastSelectedIndex !== null &&
        allIds &&
        shiftKey
      ) {
        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)
        const idsInRange = allIds.slice(start, end + 1)

        // If the clicked item is selected, select the range
        // If it's unselected, unselect the range
        const shouldSelect = !prev.has(id)
        idsInRange.forEach((rangeId) => {
          if (shouldSelect) {
            next.add(rangeId)
          } else {
            next.delete(rangeId)
          }
        })
      } else {
        // Normal toggle
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
      }

      return next
    })

    if (index !== undefined) {
      setLastSelectedIndex(index)
    }
  }, [lastSelectedIndex])

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      // If all are selected, deselect all
      // Otherwise, select all
      const allSelected = ids.every((id) => prev.has(id))
      if (allSelected) {
        return new Set()
      }
      return new Set(ids)
    })
    setLastSelectedIndex(null)
  }, [])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedIndex(null)
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const selectedCount = selectedIds.size
  const selectedArray = Array.from(selectedIds)
  const isAllSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds]
  )

  return {
    selectedIds: selectedArray,
    selectedCount,
    toggle,
    toggleAll,
    clear,
    isSelected,
    isAllSelected,
  }
}
