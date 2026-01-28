'use client'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  authorName: string
  body: string
  timestamp: string
  isSender: boolean
  /** Truncate message body to 2 lines (for previews) */
  truncate?: boolean
  /** Show only date (for previews) or full date+time */
  showTimeOnly?: 'date' | 'datetime'
}

export function ChatMessage({
  authorName,
  body,
  timestamp,
  isSender,
  truncate = false,
  showTimeOnly = 'datetime',
}: ChatMessageProps) {
  const formattedTime = showTimeOnly === 'date'
    ? new Date(timestamp).toLocaleDateString()
    : new Date(timestamp).toLocaleString()

  return (
    <div
      className={cn(
        'flex',
        isSender ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'group max-w-[90%] rounded-2xl px-4 py-2',
          isSender
            ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        )}
      >
        <p className={cn(
          'text-sm font-medium mb-1',
          isSender ? 'text-right' : 'text-left'
        )}>
          {authorName}
        </p>
        <p className={cn(
          'whitespace-pre-wrap break-words',
          truncate && 'line-clamp-2'
        )}>
          {body}
        </p>
        <p
          className={cn(
            'text-xs max-h-0 overflow-hidden group-hover:max-h-6 group-hover:mt-1 transition-all duration-200',
            isSender
              ? 'text-green-700 dark:text-green-300'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  )
}
