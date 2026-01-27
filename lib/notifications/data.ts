// Data access layer for notifications

import { createClient } from '@/utils/supabase/server'
import type { NotificationInsert, Notification, ReminderConfig } from './types'

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching unread notifications:', error)
    return []
  }

  return data as Notification[]
}

/**
 * Get all notifications for the current user (with pagination)
 */
export async function getNotifications(options?: {
  limit?: number
  offset?: number
  includeRead?: boolean
}): Promise<{ notifications: Notification[]; total: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { notifications: [], total: 0 }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  const includeRead = options?.includeRead ?? true

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (!includeRead) {
    query = query.is('read_at', null)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    return { notifications: [], total: 0 }
  }

  return {
    notifications: data as Notification[],
    total: count ?? 0,
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }

  return count ?? 0
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }

  return true
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllAsRead(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }

  return true
}

/**
 * Insert a notification (used by scheduler and immediate triggers)
 * Uses ON CONFLICT to prevent duplicates
 */
export async function insertNotification(
  notification: NotificationInsert
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .upsert(notification, {
      onConflict: 'user_id,entity_type,entity_id,type',
      ignoreDuplicates: true,
    })
    .select('id')
    .single()

  if (error) {
    // Ignore duplicate key errors
    if (error.code === '23505') return null
    console.error('Error inserting notification:', error)
    return null
  }

  return data?.id ?? null
}

/**
 * Insert multiple notifications in batch
 */
export async function insertNotifications(
  notifications: NotificationInsert[]
): Promise<number> {
  if (notifications.length === 0) return 0

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .upsert(notifications, {
      onConflict: 'user_id,entity_type,entity_id,type',
      ignoreDuplicates: true,
    })
    .select('id')

  if (error) {
    console.error('Error inserting notifications:', error)
    return 0
  }

  return data?.length ?? 0
}

/**
 * Get agency settings for reminder configuration
 */
export async function getReminderConfig(): Promise<ReminderConfig> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('agency_settings')
    .select('timezone, reminder_frequency')
    .single()

  if (error || !data) {
    // Return defaults
    return {
      timezone: 'Australia/Adelaide',
      reminder_frequency: 'daily',
      pending_days_threshold: 7,
    }
  }

  return {
    timezone: data.timezone ?? 'Australia/Adelaide',
    reminder_frequency: data.reminder_frequency ?? 'daily',
    pending_days_threshold: 7,
  }
}

/**
 * Get overdue tasks for scheduler
 */
export async function getOverdueTasks(): Promise<Array<{
  id: string
  title: string
  due_date: string
  status: string
  assigned_to: string | null
  project_id: string
  project_name: string
}>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      due_date,
      status,
      assigned_to,
      project_id,
      agency_projects!inner(name)
    `)
    .not('due_date', 'is', null)
    .not('status', 'eq', 'done')
    .is('deleted_at', null)
    .lt('due_date', new Date().toISOString().split('T')[0])

  if (error) {
    console.error('Error fetching overdue tasks:', error)
    return []
  }

  return (data ?? []).map((task) => {
    const projectData = Array.isArray(task.agency_projects)
      ? task.agency_projects[0]
      : task.agency_projects
    return {
      id: task.id,
      title: task.title,
      due_date: task.due_date,
      status: task.status,
      assigned_to: task.assigned_to,
      project_id: task.project_id,
      project_name: (projectData as { name: string } | undefined)?.name ?? 'Unknown Project',
    }
  })
}

/**
 * Get overdue milestones for scheduler
 */
export async function getOverdueMilestones(): Promise<Array<{
  id: string
  title: string
  due_date: string
  status: string
  amount: number
  project_id: string
  project_name: string
  project_owner_id: string
}>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milestones')
    .select(`
      id,
      title,
      due_date,
      status,
      amount,
      project_id,
      agency_projects!inner(name, owner_id)
    `)
    .not('due_date', 'is', null)
    .not('status', 'in', '(complete,invoiced)')
    .lt('due_date', new Date().toISOString().split('T')[0])

  if (error) {
    console.error('Error fetching overdue milestones:', error)
    return []
  }

  return (data ?? []).map((milestone) => {
    const projectData = Array.isArray(milestone.agency_projects)
      ? milestone.agency_projects[0]
      : milestone.agency_projects
    return {
      id: milestone.id,
      title: milestone.title,
      due_date: milestone.due_date,
      status: milestone.status,
      amount: Number(milestone.amount),
      project_id: milestone.project_id,
      project_name: (projectData as { name: string; owner_id: string } | undefined)?.name ?? 'Unknown Project',
      project_owner_id: (projectData as { name: string; owner_id: string } | undefined)?.owner_id ?? '',
    }
  })
}

/**
 * Get pending proposals (sent but not signed after X days)
 */
export async function getPendingProposals(daysThreshold: number): Promise<Array<{
  id: string
  title: string
  sent_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
}>> {
  const supabase = await createClient()
  
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id,
      title,
      sent_at,
      status,
      project_id,
      agency_projects!inner(name, owner_id)
    `)
    .eq('status', 'sent')
    .not('sent_at', 'is', null)
    .lt('sent_at', thresholdDate.toISOString())

  if (error) {
    console.error('Error fetching pending proposals:', error)
    return []
  }

  return (data ?? []).map((proposal) => {
    const projectData = Array.isArray(proposal.agency_projects)
      ? proposal.agency_projects[0]
      : proposal.agency_projects
    return {
      id: proposal.id,
      title: proposal.title,
      sent_at: proposal.sent_at,
      status: proposal.status,
      project_id: proposal.project_id,
      project_name: (projectData as { name: string; owner_id: string } | undefined)?.name ?? 'Unknown Project',
      project_owner_id: (projectData as { name: string; owner_id: string } | undefined)?.owner_id ?? '',
    }
  })
}

/**
 * Get pending change requests (sent but not signed after X days)
 */
export async function getPendingChangeRequests(daysThreshold: number): Promise<Array<{
  id: string
  title: string
  created_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
}>> {
  const supabase = await createClient()
  
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

  const { data, error } = await supabase
    .from('change_requests')
    .select(`
      id,
      title,
      created_at,
      status,
      project_id,
      agency_projects!inner(name, owner_id)
    `)
    .eq('status', 'sent')
    .lt('created_at', thresholdDate.toISOString())

  if (error) {
    console.error('Error fetching pending change requests:', error)
    return []
  }

  return (data ?? []).map((cr) => {
    const projectData = Array.isArray(cr.agency_projects)
      ? cr.agency_projects[0]
      : cr.agency_projects
    return {
      id: cr.id,
      title: cr.title,
      created_at: cr.created_at,
      status: cr.status,
      project_id: cr.project_id,
      project_name: (projectData as { name: string; owner_id: string } | undefined)?.name ?? 'Unknown Project',
      project_owner_id: (projectData as { name: string; owner_id: string } | undefined)?.owner_id ?? '',
    }
  })
}
