import { describe, expect, it } from 'vitest'
import {
  getEntityUrl,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
  type NotificationEntityType,
} from '@/lib/notifications/types'

describe('getEntityUrl', () => {
  it('returns correct URL for task entity', () => {
    const url = getEntityUrl('task', 'task-123')
    expect(url).toBe('/admin/tasks?task=task-123')
  })

  it('returns correct URL for milestone entity', () => {
    const url = getEntityUrl('milestone', 'milestone-456')
    expect(url).toBe('/admin/milestones/milestone-456')
  })

  it('returns correct URL for invoice entity', () => {
    const url = getEntityUrl('invoice', 'invoice-789')
    expect(url).toBe('/admin/invoices/invoice-789')
  })

  it('returns correct URL for proposal entity', () => {
    const url = getEntityUrl('proposal', 'proposal-abc')
    expect(url).toBe('/admin/proposals/proposal-abc')
  })

  it('returns correct URL for change_request entity', () => {
    const url = getEntityUrl('change_request', 'cr-def')
    expect(url).toBe('/admin/change-requests/cr-def')
  })

  it('returns fallback URL for unknown entity type', () => {
    // Cast to bypass TypeScript for edge case testing
    const url = getEntityUrl('unknown' as NotificationEntityType, 'id-123')
    expect(url).toBe('/admin')
  })
})

describe('NOTIFICATION_TYPE_LABELS', () => {
  it('has label for overdue_task', () => {
    expect(NOTIFICATION_TYPE_LABELS.overdue_task).toBe('Overdue Task')
  })

  it('has label for overdue_invoice', () => {
    expect(NOTIFICATION_TYPE_LABELS.overdue_invoice).toBe('Overdue Invoice')
  })

  it('has label for overdue_milestone', () => {
    expect(NOTIFICATION_TYPE_LABELS.overdue_milestone).toBe('Overdue Milestone')
  })

  it('has label for proposal_signed', () => {
    expect(NOTIFICATION_TYPE_LABELS.proposal_signed).toBe('Proposal Signed')
  })

  it('has label for invoice_paid', () => {
    expect(NOTIFICATION_TYPE_LABELS.invoice_paid).toBe('Invoice Paid')
  })

  it('has label for change_request_signed', () => {
    expect(NOTIFICATION_TYPE_LABELS.change_request_signed).toBe('Change Request Signed')
  })

  it('covers all NotificationType values', () => {
    const allTypes: NotificationType[] = [
      'overdue_task',
      'overdue_invoice',
      'overdue_milestone',
      'proposal_signed',
      'invoice_paid',
      'change_request_signed',
    ]

    for (const type of allTypes) {
      expect(NOTIFICATION_TYPE_LABELS[type]).toBeDefined()
      expect(typeof NOTIFICATION_TYPE_LABELS[type]).toBe('string')
    }
  })
})
