/**
 * Notification types for in-app reminders
 */

// The types of notifications that can be created
export type NotificationType =
  | 'overdue_task'
  | 'overdue_invoice'
  | 'overdue_milestone'
  | 'proposal_signed'
  | 'invoice_paid'
  | 'change_request_signed'

// The entity types that notifications can reference
export type NotificationEntityType =
  | 'task'
  | 'milestone'
  | 'invoice'
  | 'proposal'
  | 'change_request'

// Database notification record
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  entity_type: NotificationEntityType
  entity_id: string
  read_at: string | null
  created_at: string
}

// Notification with user info (for admin views)
export interface NotificationWithUser extends Notification {
  user?: {
    id: string
    name: string
    email: string
  }
}

// Input for creating a notification
export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  body?: string
  entity_type: NotificationEntityType
  entity_id: string
}

// Grouped notifications for UI display
export interface NotificationGroup {
  date: string // ISO date string
  notifications: Notification[]
}

// Notification counts for badge display
export interface NotificationCounts {
  total: number
  unread: number
}

// Entity URL mapping helper
export function getEntityUrl(entityType: NotificationEntityType, entityId: string): string {
  switch (entityType) {
    case 'task':
      return `/admin/tasks?task=${entityId}`
    case 'milestone':
      return `/admin/milestones/${entityId}`
    case 'invoice':
      return `/admin/invoices/${entityId}`
    case 'proposal':
      return `/admin/proposals/${entityId}`
    case 'change_request':
      return `/admin/change-requests/${entityId}`
    default:
      return '/admin'
  }
}

// Human-readable notification type labels
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  overdue_task: 'Overdue Task',
  overdue_invoice: 'Overdue Invoice',
  overdue_milestone: 'Overdue Milestone',
  proposal_signed: 'Proposal Signed',
  invoice_paid: 'Invoice Paid',
  change_request_signed: 'Change Request Signed',
}
