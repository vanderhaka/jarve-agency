'use client'

import { cn } from '@/lib/utils'
import type { InvoiceTimelineEvent, InvoiceTimelineEventStatus } from '@/lib/invoices/status'

interface InvoiceTimelineProps {
  events: InvoiceTimelineEvent[]
}

const statusStyles: Record<InvoiceTimelineEventStatus, { dot: string; text: string }> = {
  complete: {
    dot: 'bg-green-500',
    text: 'text-foreground',
  },
  current: {
    dot: 'bg-blue-500',
    text: 'text-foreground',
  },
  pending: {
    dot: 'bg-muted-foreground/40',
    text: 'text-muted-foreground',
  },
  error: {
    dot: 'bg-red-500',
    text: 'text-red-600',
  },
}

function formatTimelineDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function InvoiceTimeline({ events }: InvoiceTimelineProps) {
  if (events.length === 0) return null

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const styles = statusStyles[event.status]
        const timestamp = formatTimelineDate(event.timestamp)
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn('h-2.5 w-2.5 rounded-full mt-1', styles.dot)} />
              {!isLast && <span className="flex-1 w-px bg-muted mt-1" />}
            </div>
            <div className="flex-1">
              <div className={cn('text-sm font-medium', styles.text)}>{event.label}</div>
              {timestamp && (
                <div className="text-xs text-muted-foreground">{timestamp}</div>
              )}
              {event.detail && (
                <div className="text-xs text-muted-foreground">{event.detail}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
