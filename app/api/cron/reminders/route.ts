import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  createOverdueTaskNotification,
  createOverdueMilestoneNotification,
  createPendingChangeRequestNotification,
} from '@/lib/notifications/helpers'
import type { NotificationInsert, ReminderConfig } from '@/lib/notifications/types'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not set')
    return false
  }
  
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const notifications: NotificationInsert[] = []
  
  // Get agency settings for timezone
  const { data: settings } = await supabase
    .from('agency_settings')
    .select('timezone, reminder_frequency')
    .single()

  const config: ReminderConfig = {
    timezone: settings?.timezone ?? 'Australia/Adelaide',
    reminder_frequency: settings?.reminder_frequency ?? 'daily',
    pending_days_threshold: 7,
  }

  const today = new Date().toISOString().split('T')[0]

  // 1. Get overdue tasks
  const { data: overdueTasks } = await supabase
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
    .lt('due_date', today)

  for (const task of overdueTasks ?? []) {
    // Handle Supabase join - can be array or object
    const projectData = Array.isArray(task.agency_projects)
      ? task.agency_projects[0]
      : task.agency_projects
    
    const notification = createOverdueTaskNotification({
      id: task.id,
      title: task.title,
      due_date: task.due_date,
      status: task.status,
      assigned_to: task.assigned_to,
      project_id: task.project_id,
      project_name: (projectData as { name: string } | undefined)?.name ?? 'Unknown',
    }, config)
    
    if (notification) {
      notifications.push(notification)
    }
  }

  // 2. Get overdue milestones
  const { data: overdueMilestones } = await supabase
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
    .lt('due_date', today)

  for (const milestone of overdueMilestones ?? []) {
    // Handle Supabase join - can be array or object
    const projectData = Array.isArray(milestone.agency_projects)
      ? milestone.agency_projects[0]
      : milestone.agency_projects
    
    const notification = createOverdueMilestoneNotification({
      id: milestone.id,
      title: milestone.title,
      due_date: milestone.due_date,
      status: milestone.status,
      amount: Number(milestone.amount),
      project_id: milestone.project_id,
      project_name: (projectData as { name: string; owner_id: string } | undefined)?.name ?? 'Unknown',
      project_owner_id: (projectData as { name: string; owner_id: string } | undefined)?.owner_id ?? '',
    }, config)
    
    if (notification) {
      notifications.push(notification)
    }
  }

  // 3. Get pending change requests (sent 7+ days ago)
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - config.pending_days_threshold)

  const { data: pendingCRs } = await supabase
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

  for (const cr of pendingCRs ?? []) {
    // Handle Supabase join - can be array or object
    const projectData = Array.isArray(cr.agency_projects)
      ? cr.agency_projects[0]
      : cr.agency_projects
    
    const notification = createPendingChangeRequestNotification({
      id: cr.id,
      title: cr.title,
      created_at: cr.created_at,
      status: cr.status,
      project_id: cr.project_id,
      project_name: (projectData as { name: string; owner_id: string } | undefined)?.name ?? 'Unknown',
      project_owner_id: (projectData as { name: string; owner_id: string } | undefined)?.owner_id ?? '',
    }, config)
    
    if (notification) {
      notifications.push(notification)
    }
  }

  // 4. Insert all notifications (upsert to prevent duplicates)
  let insertedCount = 0
  if (notifications.length > 0) {
    const { data: inserted } = await supabase
      .from('notifications')
      .upsert(notifications, {
        onConflict: 'user_id,entity_type,entity_id,type',
        ignoreDuplicates: true,
      })
      .select('id')

    insertedCount = inserted?.length ?? 0
  }

  return NextResponse.json({
    success: true,
    processed: {
      tasks: overdueTasks?.length ?? 0,
      milestones: overdueMilestones?.length ?? 0,
      changeRequests: pendingCRs?.length ?? 0,
    },
    notificationsCreated: insertedCount,
  })
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request)
}
