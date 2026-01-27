// Helper functions for notifications

import type {
  EntityType,
  NotificationInsert,
  OverdueTask,
  OverdueMilestone,
  OverdueInvoice,
  PendingProposal,
  PendingChangeRequest,
  ReminderConfig,
} from './types'

/**
 * Check if a date is overdue based on timezone
 */
export function isOverdue(dueDate: string | Date | null, timezone: string): boolean {
  if (!dueDate) return false

  const due = new Date(dueDate)
  const now = new Date()

  // Get today's date in the agency timezone
  const todayInTimezone = new Date(
    now.toLocaleString('en-US', { timeZone: timezone })
  )
  todayInTimezone.setHours(0, 0, 0, 0)

  const dueInTimezone = new Date(
    due.toLocaleString('en-US', { timeZone: timezone })
  )
  dueInTimezone.setHours(0, 0, 0, 0)

  return dueInTimezone < todayInTimezone
}

/**
 * Check if a date is X days ago (for pending reminders)
 */
export function isDaysAgo(date: string | Date, days: number, timezone: string): boolean {
  const sent = new Date(date)
  const now = new Date()

  const nowInTimezone = new Date(
    now.toLocaleString('en-US', { timeZone: timezone })
  )

  const diffMs = nowInTimezone.getTime() - sent.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays >= days
}

/**
 * Format days overdue for notification body
 */
export function formatDaysOverdue(dueDate: string | Date, timezone: string): string {
  const due = new Date(dueDate)
  const now = new Date()

  const nowInTimezone = new Date(
    now.toLocaleString('en-US', { timeZone: timezone })
  )
  nowInTimezone.setHours(0, 0, 0, 0)

  const dueInTimezone = new Date(
    due.toLocaleString('en-US', { timeZone: timezone })
  )
  dueInTimezone.setHours(0, 0, 0, 0)

  const diffMs = nowInTimezone.getTime() - dueInTimezone.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return '1 day overdue'
  return `${diffDays} days overdue`
}

/**
 * Create notification for overdue task
 */
export function createOverdueTaskNotification(
  task: OverdueTask,
  config: ReminderConfig
): NotificationInsert | null {
  if (!task.assigned_to) return null
  if (!isOverdue(task.due_date, config.timezone)) return null
  if (task.status === 'done') return null

  return {
    user_id: task.assigned_to,
    type: 'overdue_task',
    title: `Overdue task: ${task.title}`,
    body: `${task.project_name} • ${formatDaysOverdue(task.due_date, config.timezone)}`,
    entity_type: 'task',
    entity_id: task.id,
  }
}

/**
 * Create notification for overdue milestone
 */
export function createOverdueMilestoneNotification(
  milestone: OverdueMilestone,
  config: ReminderConfig
): NotificationInsert | null {
  if (!isOverdue(milestone.due_date, config.timezone)) return null
  if (['complete', 'invoiced'].includes(milestone.status)) return null

  const amount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(milestone.amount)

  return {
    user_id: milestone.project_owner_id,
    type: 'overdue_milestone',
    title: `Overdue milestone: ${milestone.title}`,
    body: `${milestone.project_name} • ${amount} • ${formatDaysOverdue(milestone.due_date, config.timezone)}`,
    entity_type: 'milestone',
    entity_id: milestone.id,
  }
}

/**
 * Create notification for overdue invoice
 */
export function createOverdueInvoiceNotification(
  invoice: OverdueInvoice,
  config: ReminderConfig
): NotificationInsert | null {
  if (!isOverdue(invoice.due_date, config.timezone)) return null
  if (invoice.status === 'PAID') return null

  const amount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(invoice.total)

  return {
    user_id: invoice.owner_id,
    type: 'overdue_invoice',
    title: `Overdue invoice: ${invoice.invoice_number}`,
    body: `${invoice.client_name} • ${amount} • ${formatDaysOverdue(invoice.due_date, config.timezone)}`,
    entity_type: 'invoice',
    entity_id: invoice.id,
  }
}

/**
 * Create notification for pending proposal (not signed after X days)
 */
export function createPendingProposalNotification(
  proposal: PendingProposal,
  config: ReminderConfig
): NotificationInsert | null {
  if (!isDaysAgo(proposal.sent_at, config.pending_days_threshold, config.timezone)) return null
  if (proposal.status !== 'sent') return null

  return {
    user_id: proposal.project_owner_id,
    type: 'proposal_pending',
    title: `Awaiting signature: ${proposal.title}`,
    body: `${proposal.project_name} • Sent ${config.pending_days_threshold}+ days ago`,
    entity_type: 'proposal',
    entity_id: proposal.id,
  }
}

/**
 * Create notification for pending change request (not signed after X days)
 */
export function createPendingChangeRequestNotification(
  cr: PendingChangeRequest,
  config: ReminderConfig
): NotificationInsert | null {
  if (!isDaysAgo(cr.created_at, config.pending_days_threshold, config.timezone)) return null
  if (cr.status !== 'sent') return null

  return {
    user_id: cr.project_owner_id,
    type: 'change_request_pending',
    title: `Awaiting signature: ${cr.title}`,
    body: `${cr.project_name} • Sent ${config.pending_days_threshold}+ days ago`,
    entity_type: 'change_request',
    entity_id: cr.id,
  }
}

/**
 * Create immediate notification for proposal signed
 */
export function createProposalSignedNotification(
  proposalId: string,
  proposalTitle: string,
  projectName: string,
  ownerId: string
): NotificationInsert {
  return {
    user_id: ownerId,
    type: 'proposal_signed',
    title: `Proposal signed: ${proposalTitle}`,
    body: `${projectName} • Client has signed the proposal`,
    entity_type: 'proposal',
    entity_id: proposalId,
  }
}

/**
 * Create immediate notification for change request signed
 */
export function createChangeRequestSignedNotification(
  crId: string,
  crTitle: string,
  projectName: string,
  ownerId: string
): NotificationInsert {
  return {
    user_id: ownerId,
    type: 'change_request_signed',
    title: `Change request signed: ${crTitle}`,
    body: `${projectName} • Client has approved the change`,
    entity_type: 'change_request',
    entity_id: crId,
  }
}

/**
 * Create immediate notification for invoice paid
 */
export function createInvoicePaidNotification(
  invoiceId: string,
  invoiceNumber: string,
  clientName: string,
  amount: number,
  ownerId: string
): NotificationInsert {
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)

  return {
    user_id: ownerId,
    type: 'invoice_paid',
    title: `Invoice paid: ${invoiceNumber}`,
    body: `${clientName} • ${formattedAmount}`,
    entity_type: 'invoice',
    entity_id: invoiceId,
  }
}

/**
 * Get the navigation URL for a notification
 */
export function getNotificationUrl(notification: {
  entity_type: EntityType
  entity_id: string
}): string {
  switch (notification.entity_type) {
    case 'task':
      // Tasks are viewed in project context - need project_id from task
      return `/admin/projects?task=${notification.entity_id}`
    case 'milestone':
      return `/admin/projects?milestone=${notification.entity_id}`
    case 'invoice':
      return `/admin/invoices/${notification.entity_id}`
    case 'proposal':
      return `/admin/proposals/${notification.entity_id}`
    case 'change_request':
      return `/admin/projects?cr=${notification.entity_id}`
    default:
      return '/admin'
  }
}
