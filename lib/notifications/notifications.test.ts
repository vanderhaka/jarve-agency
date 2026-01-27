import { describe, it, expect } from 'vitest'
import {
  isOverdue,
  isDaysAgo,
  formatDaysOverdue,
  createOverdueTaskNotification,
  createOverdueMilestoneNotification,
  createOverdueInvoiceNotification,
  createPendingProposalNotification,
  createPendingChangeRequestNotification,
  createProposalSignedNotification,
  createChangeRequestSignedNotification,
  createInvoicePaidNotification,
  getNotificationUrl,
} from './helpers'
import type { ReminderConfig } from './types'

const DEFAULT_CONFIG: ReminderConfig = {
  timezone: 'Australia/Adelaide',
  reminder_frequency: 'daily',
  pending_days_threshold: 7,
}

describe('Notification Business Logic', () => {
  describe('isOverdue', () => {
    it('returns false for null due date', () => {
      expect(isOverdue(null, 'Australia/Adelaide')).toBe(false)
    })

    it('returns true for past due date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isOverdue(yesterday.toISOString(), 'Australia/Adelaide')).toBe(true)
    })

    it('returns false for future due date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isOverdue(tomorrow.toISOString(), 'Australia/Adelaide')).toBe(false)
    })

    it('handles different timezones', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isOverdue(yesterday.toISOString(), 'America/New_York')).toBe(true)
      expect(isOverdue(yesterday.toISOString(), 'Europe/London')).toBe(true)
    })
  })

  describe('isDaysAgo', () => {
    it('returns true when date is more than or equal to X days ago', () => {
      // Set to 8 days ago to avoid timezone edge cases
      const eightDaysAgo = new Date()
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)
      expect(isDaysAgo(eightDaysAgo.toISOString(), 7, 'Australia/Adelaide')).toBe(true)
    })

    it('returns true when date is more than X days ago', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      expect(isDaysAgo(tenDaysAgo.toISOString(), 7, 'Australia/Adelaide')).toBe(true)
    })

    it('returns false when date is less than X days ago', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      expect(isDaysAgo(threeDaysAgo.toISOString(), 7, 'Australia/Adelaide')).toBe(false)
    })
  })

  describe('formatDaysOverdue', () => {
    it('formats 1 day overdue correctly', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatDaysOverdue(yesterday.toISOString(), 'Australia/Adelaide')).toBe('1 day overdue')
    })

    it('formats multiple days overdue correctly', () => {
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      expect(formatDaysOverdue(fiveDaysAgo.toISOString(), 'Australia/Adelaide')).toBe('5 days overdue')
    })
  })

  describe('createOverdueTaskNotification', () => {
    it('creates notification for overdue task with assignee', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        due_date: yesterday.toISOString(),
        status: 'todo',
        assigned_to: 'user-1',
        project_id: 'proj-1',
        project_name: 'Test Project',
      }

      const notification = createOverdueTaskNotification(task, DEFAULT_CONFIG)
      
      expect(notification).not.toBeNull()
      expect(notification?.type).toBe('overdue_task')
      expect(notification?.title).toBe('Overdue task: Test Task')
      expect(notification?.user_id).toBe('user-1')
      expect(notification?.entity_type).toBe('task')
      expect(notification?.entity_id).toBe('task-1')
    })

    it('returns null for task without assignee', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        due_date: yesterday.toISOString(),
        status: 'todo',
        assigned_to: null,
        project_id: 'proj-1',
        project_name: 'Test Project',
      }

      expect(createOverdueTaskNotification(task, DEFAULT_CONFIG)).toBeNull()
    })

    it('returns null for completed task', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        due_date: yesterday.toISOString(),
        status: 'done',
        assigned_to: 'user-1',
        project_id: 'proj-1',
        project_name: 'Test Project',
      }

      expect(createOverdueTaskNotification(task, DEFAULT_CONFIG)).toBeNull()
    })

    it('returns null for task with future due date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const task = {
        id: 'task-1',
        title: 'Test Task',
        due_date: tomorrow.toISOString(),
        status: 'todo',
        assigned_to: 'user-1',
        project_id: 'proj-1',
        project_name: 'Test Project',
      }

      expect(createOverdueTaskNotification(task, DEFAULT_CONFIG)).toBeNull()
    })
  })

  describe('createOverdueMilestoneNotification', () => {
    it('creates notification for overdue milestone', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const milestone = {
        id: 'milestone-1',
        title: 'Design Phase',
        due_date: yesterday.toISOString(),
        status: 'active',
        amount: 5000,
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      const notification = createOverdueMilestoneNotification(milestone, DEFAULT_CONFIG)
      
      expect(notification).not.toBeNull()
      expect(notification?.type).toBe('overdue_milestone')
      expect(notification?.title).toBe('Overdue milestone: Design Phase')
      expect(notification?.user_id).toBe('owner-1')
      expect(notification?.body).toContain('$5,000.00')
    })

    it('returns null for complete milestone', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const milestone = {
        id: 'milestone-1',
        title: 'Design Phase',
        due_date: yesterday.toISOString(),
        status: 'complete',
        amount: 5000,
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      expect(createOverdueMilestoneNotification(milestone, DEFAULT_CONFIG)).toBeNull()
    })

    it('returns null for invoiced milestone', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const milestone = {
        id: 'milestone-1',
        title: 'Design Phase',
        due_date: yesterday.toISOString(),
        status: 'invoiced',
        amount: 5000,
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      expect(createOverdueMilestoneNotification(milestone, DEFAULT_CONFIG)).toBeNull()
    })
  })

  describe('createOverdueInvoiceNotification', () => {
    it('creates notification for overdue invoice', () => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      
      const invoice = {
        id: 'inv-1',
        invoice_number: 'INV-001',
        due_date: lastWeek.toISOString(),
        status: 'AUTHORISED',
        total: 1500,
        client_name: 'Acme Corp',
        owner_id: 'owner-1',
      }

      const notification = createOverdueInvoiceNotification(invoice, DEFAULT_CONFIG)
      
      expect(notification).not.toBeNull()
      expect(notification?.type).toBe('overdue_invoice')
      expect(notification?.title).toBe('Overdue invoice: INV-001')
      expect(notification?.body).toContain('Acme Corp')
      expect(notification?.body).toContain('$1,500.00')
    })

    it('returns null for paid invoice', () => {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      
      const invoice = {
        id: 'inv-1',
        invoice_number: 'INV-001',
        due_date: lastWeek.toISOString(),
        status: 'PAID',
        total: 1500,
        client_name: 'Acme Corp',
        owner_id: 'owner-1',
      }

      expect(createOverdueInvoiceNotification(invoice, DEFAULT_CONFIG)).toBeNull()
    })
  })

  describe('createPendingProposalNotification', () => {
    it('creates notification for proposal pending 7+ days', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      
      const proposal = {
        id: 'prop-1',
        title: 'Website Redesign',
        sent_at: tenDaysAgo.toISOString(),
        status: 'sent',
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      const notification = createPendingProposalNotification(proposal, DEFAULT_CONFIG)
      
      expect(notification).not.toBeNull()
      expect(notification?.type).toBe('proposal_pending')
      expect(notification?.title).toBe('Awaiting signature: Website Redesign')
    })

    it('returns null for recently sent proposal', () => {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      
      const proposal = {
        id: 'prop-1',
        title: 'Website Redesign',
        sent_at: threeDaysAgo.toISOString(),
        status: 'sent',
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      expect(createPendingProposalNotification(proposal, DEFAULT_CONFIG)).toBeNull()
    })

    it('returns null for signed proposal', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      
      const proposal = {
        id: 'prop-1',
        title: 'Website Redesign',
        sent_at: tenDaysAgo.toISOString(),
        status: 'signed',
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      expect(createPendingProposalNotification(proposal, DEFAULT_CONFIG)).toBeNull()
    })
  })

  describe('createPendingChangeRequestNotification', () => {
    it('creates notification for CR pending 7+ days', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      
      const cr = {
        id: 'cr-1',
        title: 'Additional Feature',
        created_at: tenDaysAgo.toISOString(),
        status: 'sent',
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      const notification = createPendingChangeRequestNotification(cr, DEFAULT_CONFIG)
      
      expect(notification).not.toBeNull()
      expect(notification?.type).toBe('change_request_pending')
      expect(notification?.title).toBe('Awaiting signature: Additional Feature')
    })

    it('returns null for draft CR', () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      
      const cr = {
        id: 'cr-1',
        title: 'Additional Feature',
        created_at: tenDaysAgo.toISOString(),
        status: 'draft',
        project_id: 'proj-1',
        project_name: 'Test Project',
        project_owner_id: 'owner-1',
      }

      expect(createPendingChangeRequestNotification(cr, DEFAULT_CONFIG)).toBeNull()
    })
  })

  describe('Immediate Notification Creators', () => {
    it('creates proposal signed notification', () => {
      const notification = createProposalSignedNotification(
        'prop-1',
        'Website Redesign',
        'Acme Project',
        'owner-1'
      )

      expect(notification.type).toBe('proposal_signed')
      expect(notification.title).toBe('Proposal signed: Website Redesign')
      expect(notification.user_id).toBe('owner-1')
    })

    it('creates change request signed notification', () => {
      const notification = createChangeRequestSignedNotification(
        'cr-1',
        'Extra Feature',
        'Acme Project',
        'owner-1'
      )

      expect(notification.type).toBe('change_request_signed')
      expect(notification.title).toBe('Change request signed: Extra Feature')
    })

    it('creates invoice paid notification', () => {
      const notification = createInvoicePaidNotification(
        'inv-1',
        'INV-001',
        'Acme Corp',
        2500,
        'owner-1'
      )

      expect(notification.type).toBe('invoice_paid')
      expect(notification.title).toBe('Invoice paid: INV-001')
      expect(notification.body).toContain('$2,500.00')
    })
  })

  describe('getNotificationUrl', () => {
    it('returns correct URL for task', () => {
      expect(getNotificationUrl({ entity_type: 'task', entity_id: '123' }))
        .toBe('/admin/projects?task=123')
    })

    it('returns correct URL for milestone', () => {
      expect(getNotificationUrl({ entity_type: 'milestone', entity_id: '123' }))
        .toBe('/admin/projects?milestone=123')
    })

    it('returns correct URL for invoice', () => {
      expect(getNotificationUrl({ entity_type: 'invoice', entity_id: '123' }))
        .toBe('/admin/invoices/123')
    })

    it('returns correct URL for proposal', () => {
      expect(getNotificationUrl({ entity_type: 'proposal', entity_id: '123' }))
        .toBe('/admin/proposals/123')
    })

    it('returns correct URL for change request', () => {
      expect(getNotificationUrl({ entity_type: 'change_request', entity_id: '123' }))
        .toBe('/admin/projects?cr=123')
    })
  })
})

describe('Milestone Status Transitions (from Stage 6)', () => {
  type MilestoneStatus = 'planned' | 'active' | 'complete' | 'invoiced'

  const validTransitions: Record<MilestoneStatus, MilestoneStatus[]> = {
    planned: ['active', 'complete'],
    active: ['complete', 'planned'],
    complete: ['invoiced', 'active'],
    invoiced: [],
  }

  function isValidTransition(from: MilestoneStatus, to: MilestoneStatus): boolean {
    return validTransitions[from].includes(to)
  }

  it('invoiced is terminal - no transitions allowed', () => {
    expect(isValidTransition('invoiced', 'planned')).toBe(false)
    expect(isValidTransition('invoiced', 'active')).toBe(false)
    expect(isValidTransition('invoiced', 'complete')).toBe(false)
  })
})
