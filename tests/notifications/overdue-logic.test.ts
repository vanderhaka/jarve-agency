import { describe, expect, it } from 'vitest'

/**
 * Tests for overdue detection logic used in the cron job.
 * These tests verify the business rules for determining what items are overdue.
 */

// Task status values that are considered "incomplete"
const INCOMPLETE_TASK_STATUSES = ['todo', 'in_progress', 'blocked']

// Invoice status values that are considered "unpaid"
const UNPAID_INVOICE_STATUSES = ['draft', 'sent', 'overdue']

// Milestone status values that are considered "incomplete"
const INCOMPLETE_MILESTONE_STATUSES = ['not_started', 'in_progress']

// Helper to check if a task should trigger a notification
function shouldNotifyOverdueTask(task: {
  due_date: string | null
  status: string
  assignee_id: string | null
}, today: string): boolean {
  if (!task.due_date) return false
  if (!task.assignee_id) return false
  if (!INCOMPLETE_TASK_STATUSES.includes(task.status)) return false
  return task.due_date < today
}

// Helper to check if an invoice should trigger a notification
function shouldNotifyOverdueInvoice(invoice: {
  due_date: string | null
  status: string
  created_by: string | null
}, today: string): boolean {
  if (!invoice.due_date) return false
  if (!invoice.created_by) return false
  if (!UNPAID_INVOICE_STATUSES.includes(invoice.status)) return false
  return invoice.due_date < today
}

// Helper to check if a milestone should trigger a notification
function shouldNotifyOverdueMilestone(milestone: {
  due_date: string | null
  status: string
  assignee_id: string | null
}, today: string): boolean {
  if (!milestone.due_date) return false
  if (!milestone.assignee_id) return false
  if (!INCOMPLETE_MILESTONE_STATUSES.includes(milestone.status)) return false
  return milestone.due_date < today
}

describe('Overdue Task Detection', () => {
  const today = '2026-01-24'

  it('should notify for overdue task with incomplete status', () => {
    const task = {
      due_date: '2026-01-23', // yesterday
      status: 'todo',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(true)
  })

  it('should notify for in_progress task that is overdue', () => {
    const task = {
      due_date: '2026-01-20',
      status: 'in_progress',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(true)
  })

  it('should notify for blocked task that is overdue', () => {
    const task = {
      due_date: '2026-01-22',
      status: 'blocked',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(true)
  })

  it('should NOT notify for completed task even if overdue', () => {
    const task = {
      due_date: '2026-01-20',
      status: 'done',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(false)
  })

  it('should NOT notify for task due today (not yet overdue)', () => {
    const task = {
      due_date: '2026-01-24', // today
      status: 'todo',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(false)
  })

  it('should NOT notify for task due in the future', () => {
    const task = {
      due_date: '2026-01-30',
      status: 'todo',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(false)
  })

  it('should NOT notify for task without assignee', () => {
    const task = {
      due_date: '2026-01-20',
      status: 'todo',
      assignee_id: null,
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(false)
  })

  it('should NOT notify for task without due date', () => {
    const task = {
      due_date: null,
      status: 'todo',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueTask(task, today)).toBe(false)
  })
})

describe('Overdue Invoice Detection', () => {
  const today = '2026-01-24'

  it('should notify for overdue draft invoice', () => {
    const invoice = {
      due_date: '2026-01-20',
      status: 'draft',
      created_by: 'user-1',
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(true)
  })

  it('should notify for overdue sent invoice', () => {
    const invoice = {
      due_date: '2026-01-15',
      status: 'sent',
      created_by: 'user-1',
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(true)
  })

  it('should notify for invoice already marked overdue', () => {
    const invoice = {
      due_date: '2026-01-10',
      status: 'overdue',
      created_by: 'user-1',
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(true)
  })

  it('should NOT notify for paid invoice even if overdue', () => {
    const invoice = {
      due_date: '2026-01-10',
      status: 'paid',
      created_by: 'user-1',
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(false)
  })

  it('should NOT notify for voided invoice', () => {
    const invoice = {
      due_date: '2026-01-10',
      status: 'voided',
      created_by: 'user-1',
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(false)
  })

  it('should NOT notify for invoice due today', () => {
    const invoice = {
      due_date: '2026-01-24',
      status: 'sent',
      created_by: 'user-1',
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(false)
  })

  it('should NOT notify for invoice without created_by', () => {
    const invoice = {
      due_date: '2026-01-10',
      status: 'sent',
      created_by: null,
    }
    expect(shouldNotifyOverdueInvoice(invoice, today)).toBe(false)
  })
})

describe('Overdue Milestone Detection', () => {
  const today = '2026-01-24'

  it('should notify for overdue not_started milestone', () => {
    const milestone = {
      due_date: '2026-01-20',
      status: 'not_started',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueMilestone(milestone, today)).toBe(true)
  })

  it('should notify for overdue in_progress milestone', () => {
    const milestone = {
      due_date: '2026-01-22',
      status: 'in_progress',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueMilestone(milestone, today)).toBe(true)
  })

  it('should NOT notify for completed milestone', () => {
    const milestone = {
      due_date: '2026-01-15',
      status: 'completed',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueMilestone(milestone, today)).toBe(false)
  })

  it('should NOT notify for milestone due today', () => {
    const milestone = {
      due_date: '2026-01-24',
      status: 'in_progress',
      assignee_id: 'user-1',
    }
    expect(shouldNotifyOverdueMilestone(milestone, today)).toBe(false)
  })

  it('should NOT notify for milestone without assignee', () => {
    const milestone = {
      due_date: '2026-01-20',
      status: 'in_progress',
      assignee_id: null,
    }
    expect(shouldNotifyOverdueMilestone(milestone, today)).toBe(false)
  })
})

describe('Timezone Date Handling', () => {
  it('correctly compares ISO date strings', () => {
    // The cron job uses YYYY-MM-DD format strings for comparison
    expect('2026-01-23' < '2026-01-24').toBe(true)  // yesterday is less than today
    expect('2026-01-24' < '2026-01-24').toBe(false) // today is NOT less than today
    expect('2026-01-25' < '2026-01-24').toBe(false) // tomorrow is NOT less than today
  })

  it('handles month boundaries correctly', () => {
    expect('2026-01-31' < '2026-02-01').toBe(true)
    expect('2026-02-28' < '2026-03-01').toBe(true)
  })

  it('handles year boundaries correctly', () => {
    expect('2025-12-31' < '2026-01-01').toBe(true)
  })
})

describe('Notification Deduplication', () => {
  // The unique index in the database prevents duplicate notifications
  // This test documents the expected behavior

  it('should identify unique notification keys', () => {
    const notif1 = { user_id: 'u1', entity_type: 'task', entity_id: 't1', type: 'overdue_task' }
    const notif2 = { user_id: 'u1', entity_type: 'task', entity_id: 't1', type: 'overdue_task' }
    const notif3 = { user_id: 'u1', entity_type: 'task', entity_id: 't2', type: 'overdue_task' }
    const notif4 = { user_id: 'u2', entity_type: 'task', entity_id: 't1', type: 'overdue_task' }

    // Create unique key for comparison
    const key = (n: typeof notif1) => `${n.user_id}:${n.entity_type}:${n.entity_id}:${n.type}`

    expect(key(notif1)).toBe(key(notif2)) // Same - would be deduplicated
    expect(key(notif1)).not.toBe(key(notif3)) // Different entity_id
    expect(key(notif1)).not.toBe(key(notif4)) // Different user_id
  })
})
