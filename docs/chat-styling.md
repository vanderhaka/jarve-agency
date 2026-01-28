# Chat Message Styling Guide

This document outlines the styling patterns used for chat message bubbles throughout the application.

## Overview

Chat messages use a modern speech bubble design with:
- Distinct colors for sender vs receiver messages
- Expandable timestamps on hover
- Dark mode support
- Responsive width (90% max)

## Shared Component

All chat interfaces use the shared `ChatMessage` component located at `components/chat/chat-message.tsx`.

### Usage

```tsx
import { ChatMessage } from '@/components/chat'

<ChatMessage
  authorName="You"
  body="Hello, how are you?"
  timestamp="2024-01-28T10:00:00Z"
  isSender={true}
  truncate={false}        // Optional: truncate to 2 lines (for previews)
  showTimeOnly="datetime" // Optional: "date" or "datetime"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `authorName` | `string` | required | Display name of the message author |
| `body` | `string` | required | Message content |
| `timestamp` | `string` | required | ISO timestamp string |
| `isSender` | `boolean` | required | Whether this is from the current user |
| `truncate` | `boolean` | `false` | Truncate message to 2 lines (for previews) |
| `showTimeOnly` | `"date" \| "datetime"` | `"datetime"` | Date format for timestamp |

## Styling Breakdown

### Sender Messages (Green Bubble)
- **Light mode**: `bg-green-100 text-green-900`
- **Dark mode**: `bg-green-900/30 text-green-100`
- **Timestamp**: `text-green-700` / `text-green-300`
- **Position**: Right-aligned (`justify-end`)
- **Author name**: Right-aligned (`text-right`)

### Receiver Messages (Grey Bubble)
- **Light mode**: `bg-gray-100 text-gray-900`
- **Dark mode**: `bg-gray-800 text-gray-100`
- **Timestamp**: `text-gray-500` / `text-gray-400`
- **Position**: Left-aligned (`justify-start`)
- **Author name**: Left-aligned (`text-left`)

### Common Styles
- **Max width**: `max-w-[90%]`
- **Border radius**: `rounded-2xl` (softer bubble appearance)
- **Padding**: `px-4 py-2`
- **Text wrapping**: `whitespace-pre-wrap break-words`

### Timestamp Hover Effect
The timestamp is hidden by default and smoothly expands on hover:
- **Hidden state**: `max-h-0 overflow-hidden`
- **Hover state**: `group-hover:max-h-6 group-hover:mt-1`
- **Animation**: `transition-all duration-200`

This approach:
- Takes no space when hidden (unlike `opacity-0`)
- Smoothly animates the reveal
- Uses the `group` class on the parent for hover detection

## Determining Sender vs Receiver

The logic for determining if a message is from the sender depends on context:

### Admin View
```tsx
const isSender = message.author_type === 'owner'
```

### Client Portal View
```tsx
const isSender = message.author_type === 'client'
```

## Files Using the Shared Component

All these files import and use the `ChatMessage` component:

- `app/admin/projects/[id]/tabs/chat/index.tsx` - Admin project chat tab
- `app/admin/projects/[id]/chat/admin-chat-interface.tsx` - Admin chat interface
- `app/portal/[token]/components/chat-interface.tsx` - Client portal chat
- `app/portal/[token]/components/portal-overview.tsx` - Portal overview (uses `truncate` and `showTimeOnly="date"`)

## Duplicate Prevention

When adding messages to state (especially with realtime), always check for duplicates:

```tsx
setMessages((prev) => {
  if (prev.some((msg) => msg.id === newMessage.id)) return prev
  return [...prev, newMessage]
})
```

This prevents duplicate key errors when messages arrive from both local state updates and realtime broadcasts.
