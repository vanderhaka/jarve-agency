'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Notification,
  NotificationCounts,
  CreateNotificationInput,
} from './types'

/**
 * Get the current user's employee ID
 */
async function getCurrentEmployeeId(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .is('deleted_at', null)
    .single()

  return employee?.id || null
}

/**
 * Get notifications for the current user
 */
export async function getNotifications(options?: {
  limit?: number
  unreadOnly?: boolean
}): Promise<{ data: Notification[]; error: string | null }> {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  if (!employeeId) {
    return { data: [], error: 'Not authenticated' }
  }

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', employeeId)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.is('read_at', null)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch notifications:', error)
    return { data: [], error: 'Failed to fetch notifications' }
  }

  return { data: data as Notification[], error: null }
}

/**
 * Get notification counts for the current user
 */
export async function getNotificationCounts(): Promise<{
  data: NotificationCounts | null
  error: string | null
}> {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  if (!employeeId) {
    return { data: null, error: 'Not authenticated' }
  }

  // Get total count
  const { count: total, error: totalError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', employeeId)

  if (totalError) {
    console.error('Failed to count notifications:', totalError)
    return { data: null, error: 'Failed to count notifications' }
  }

  // Get unread count
  const { count: unread, error: unreadError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', employeeId)
    .is('read_at', null)

  if (unreadError) {
    console.error('Failed to count unread notifications:', unreadError)
    return { data: null, error: 'Failed to count unread notifications' }
  }

  return {
    data: {
      total: total || 0,
      unread: unread || 0,
    },
    error: null,
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  if (!employeeId) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', employeeId)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return { success: false, error: 'Failed to mark as read' }
  }

  revalidatePath('/admin')
  return { success: true, error: null }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  if (!employeeId) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', employeeId)
    .is('read_at', null)

  if (error) {
    console.error('Failed to mark all notifications as read:', error)
    return { success: false, error: 'Failed to mark all as read' }
  }

  revalidatePath('/admin')
  return { success: true, error: null }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId()

  if (!employeeId) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', employeeId)

  if (error) {
    console.error('Failed to delete notification:', error)
    return { success: false, error: 'Failed to delete notification' }
  }

  revalidatePath('/admin')
  return { success: true, error: null }
}

/**
 * Create a notification (typically called by the system/cron job)
 * Uses upsert to prevent duplicate notifications for the same entity
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ data: Notification | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .upsert(
      {
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body || null,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
      },
      {
        onConflict: 'user_id,entity_type,entity_id,type',
        ignoreDuplicates: true,
      }
    )
    .select()
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to create notification:', error)
    return { data: null, error: 'Failed to create notification' }
  }

  return { data: data as Notification | null, error: null }
}

/**
 * Create notifications for multiple users (batch operation)
 */
export async function createNotificationsBatch(
  inputs: CreateNotificationInput[]
): Promise<{ count: number; error: string | null }> {
  if (inputs.length === 0) {
    return { count: 0, error: null }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .upsert(
      inputs.map((input) => ({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body || null,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
      })),
      {
        onConflict: 'user_id,entity_type,entity_id,type',
        ignoreDuplicates: true,
      }
    )
    .select()

  if (error) {
    console.error('Failed to create notifications batch:', error)
    return { count: 0, error: 'Failed to create notifications' }
  }

  return { count: data?.length || 0, error: null }
}
