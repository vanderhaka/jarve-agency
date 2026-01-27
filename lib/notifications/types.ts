// Notification types for Stage 7 - Reminders & Notifications

export type NotificationType =
  | 'overdue_task'
  | 'overdue_milestone'
  | 'overdue_invoice'
  | 'proposal_pending'
  | 'proposal_signed'
  | 'change_request_pending'
  | 'change_request_signed'
  | 'invoice_paid'

export type EntityType =
  | 'task'
  | 'milestone'
  | 'invoice'
  | 'proposal'
  | 'change_request'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  entity_type: EntityType
  entity_id: string
  read_at: string | null
  created_at: string
}

export interface NotificationInsert {
  user_id: string
  type: NotificationType
  title: string
  body?: string | null
  entity_type: EntityType
  entity_id: string
}

// For scheduler - items that might be overdue
export interface OverdueTask {
  id: string
  title: string
  due_date: string
  status: string
  assigned_to: string | null
  project_id: string
  project_name: string
}

export interface OverdueMilestone {
  id: string
  title: string
  due_date: string
  status: string
  amount: number
  project_id: string
  project_name: string
  project_owner_id: string
}

export interface OverdueInvoice {
  id: string
  invoice_number: string
  due_date: string
  status: string
  total: number
  client_name: string
  owner_id: string
}

export interface PendingProposal {
  id: string
  title: string
  sent_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
}

export interface PendingChangeRequest {
  id: string
  title: string
  created_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
}

// Scheduler configuration
export interface ReminderConfig {
  timezone: string
  reminder_frequency: string
  pending_days_threshold: number // Days before pending items trigger reminder
}
