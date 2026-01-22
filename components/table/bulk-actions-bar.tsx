'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  children: React.ReactNode
  className?: string
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  children,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'bg-card border rounded-lg shadow-lg',
        'px-4 py-3 flex items-center gap-4',
        'animate-in slide-in-from-bottom-2',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      <div className="border-l h-6 border-border" />

      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
