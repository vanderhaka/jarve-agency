// Database query layer for notifications

import { createClient } from '@/utils/supabase/server'
import type { NotificationInsert, Notification, ReminderConfig } from '../types'

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
 * Get overdue tasks (raw data from database)
 */
export async function getOverdueTasks(): Promise<Array<{
  id: string
  title: string
  due_date: string
  status: string
  assigned_to: string | null
  project_id: string
  agency_projects: { name: string } | { name: string }[] | null
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

  return data ?? []
}

/**
 * Get overdue milestones (raw data from database)
 */
export async function getOverdueMilestones(): Promise<Array<{
  id: string
  title: string
  due_date: string
  status: string
  amount: number
  project_id: string
  agency_projects: { name: string; owner_id: string } | { name: string; owner_id: string }[] | null
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

  return data ?? []
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
  agency_projects: { name: string; owner_id: string } | { name: string; owner_id: string }[] | null
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

  return data ?? []
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
  agency_projects: { name: string; owner_id: string } | { name: string; owner_id: string }[] | null
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

  return data ?? []
}
