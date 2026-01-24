import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CreateNotificationInput, NotificationType, NotificationEntityType } from '@/lib/notifications/types'

// Use service role client for cron job (bypasses RLS)
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Task status values that are considered "incomplete"
const INCOMPLETE_TASK_STATUSES = ['todo', 'in_progress', 'blocked']

// Invoice status values that are considered "unpaid"
const UNPAID_INVOICE_STATUSES = ['draft', 'sent', 'overdue']

// Milestone status values that are considered "incomplete"
const INCOMPLETE_MILESTONE_STATUSES = ['not_started', 'in_progress']

// Proposal status values that are considered "pending"
const PENDING_PROPOSAL_STATUSES = ['draft', 'sent', 'viewed']

// Change request status values that are considered "pending"
const PENDING_CHANGE_REQUEST_STATUSES = ['draft', 'sent', 'viewed']

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceClient()

    // Get agency settings
    const { data: settings, error: settingsError } = await supabase
      .from('agency_settings')
      .select('reminder_frequency, reminder_time, timezone')
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Failed to fetch agency settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Check if reminders are disabled
    if (settings?.reminder_frequency === 'off') {
      return NextResponse.json({ message: 'Reminders are disabled', notifications: 0 })
    }

    // Get current date in agency timezone
    const timezone = settings?.timezone || 'Australia/Adelaide'
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }) // YYYY-MM-DD format

    const notifications: CreateNotificationInput[] = []

    // Check overdue tasks
    const { data: overdueTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, assignee_id, due_date')
      .lt('due_date', today)
      .in('status', INCOMPLETE_TASK_STATUSES)
      .not('assignee_id', 'is', null)

    if (tasksError) {
      console.error('Failed to fetch overdue tasks:', tasksError)
    } else if (overdueTasks) {
      for (const task of overdueTasks) {
        if (task.assignee_id) {
          notifications.push({
            user_id: task.assignee_id,
            type: 'overdue_task' as NotificationType,
            title: `Task overdue: ${task.title}`,
            body: `This task was due on ${task.due_date}`,
            entity_type: 'task' as NotificationEntityType,
            entity_id: task.id,
          })
        }
      }
    }

    // Check overdue invoices (assumes invoices table exists from Stage 5)
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, due_date, created_by')
      .lt('due_date', today)
      .in('status', UNPAID_INVOICE_STATUSES)

    if (invoicesError && invoicesError.code !== 'PGRST204') {
      // PGRST204 = table doesn't exist, which is expected if Stage 5 not complete
      console.error('Failed to fetch overdue invoices:', invoicesError)
    } else if (overdueInvoices) {
      for (const invoice of overdueInvoices) {
        if (invoice.created_by) {
          notifications.push({
            user_id: invoice.created_by,
            type: 'overdue_invoice' as NotificationType,
            title: `Invoice overdue: ${invoice.invoice_number}`,
            body: `This invoice was due on ${invoice.due_date}`,
            entity_type: 'invoice' as NotificationEntityType,
            entity_id: invoice.id,
          })
        }
      }
    }

    // Check overdue milestones (assumes milestones table exists from Stage 6)
    const { data: overdueMilestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('id, title, due_date, assignee_id')
      .lt('due_date', today)
      .in('status', INCOMPLETE_MILESTONE_STATUSES)
      .not('assignee_id', 'is', null)

    if (milestonesError && milestonesError.code !== 'PGRST204') {
      console.error('Failed to fetch overdue milestones:', milestonesError)
    } else if (overdueMilestones) {
      for (const milestone of overdueMilestones) {
        if (milestone.assignee_id) {
          notifications.push({
            user_id: milestone.assignee_id,
            type: 'overdue_milestone' as NotificationType,
            title: `Milestone overdue: ${milestone.title}`,
            body: `This milestone was due on ${milestone.due_date}`,
            entity_type: 'milestone' as NotificationEntityType,
            entity_id: milestone.id,
          })
        }
      }
    }

    // Insert all notifications (using upsert to prevent duplicates)
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .upsert(
          notifications.map((n) => ({
            user_id: n.user_id,
            type: n.type,
            title: n.title,
            body: n.body,
            entity_type: n.entity_type,
            entity_id: n.entity_id,
          })),
          {
            onConflict: 'user_id,entity_type,entity_id,type',
            ignoreDuplicates: true,
          }
        )

      if (insertError) {
        console.error('Failed to insert notifications:', insertError)
        return NextResponse.json(
          { error: 'Failed to create notifications', details: insertError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'Overdue check completed',
      notifications: notifications.length,
      timezone,
      today,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering during development
export async function POST(request: NextRequest) {
  return GET(request)
}
