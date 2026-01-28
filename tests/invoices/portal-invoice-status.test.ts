import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mapPortalInvoiceStatus, buildInvoiceTimeline } from '@/lib/invoices/status'

describe('mapPortalInvoiceStatus', () => {
  it('returns paid when paid_at is set', () => {
    const status = mapPortalInvoiceStatus({
      xeroStatus: 'AUTHORISED',
      paidAt: '2026-01-28T10:00:00Z',
      dueDate: '2026-02-01',
      totalPayments: 0,
      total: 100,
      paymentStatus: null,
    })

    expect(status).toBe('paid')
  })

  it('returns processing when payment status is processing', () => {
    const status = mapPortalInvoiceStatus({
      xeroStatus: 'AUTHORISED',
      paidAt: null,
      dueDate: '2026-02-01',
      totalPayments: 0,
      total: 100,
      paymentStatus: 'processing',
    })

    expect(status).toBe('processing')
  })

  it('returns payment_failed when payment status is failed', () => {
    const status = mapPortalInvoiceStatus({
      xeroStatus: 'AUTHORISED',
      paidAt: null,
      dueDate: '2026-02-01',
      totalPayments: 0,
      total: 100,
      paymentStatus: 'failed',
    })

    expect(status).toBe('payment_failed')
  })

  it('returns partially_paid when payments exist but total not reached', () => {
    const status = mapPortalInvoiceStatus({
      xeroStatus: 'AUTHORISED',
      paidAt: null,
      dueDate: '2026-02-01',
      totalPayments: 50,
      total: 100,
      paymentStatus: null,
    })

    expect(status).toBe('partially_paid')
  })

  it('returns refunded when payment status is refunded', () => {
    const status = mapPortalInvoiceStatus({
      xeroStatus: 'AUTHORISED',
      paidAt: null,
      dueDate: '2026-02-01',
      totalPayments: 0,
      total: 100,
      paymentStatus: 'refunded',
    })

    expect(status).toBe('refunded')
  })

  it('returns overdue when due date has passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T12:00:00Z'))

    const status = mapPortalInvoiceStatus({
      xeroStatus: 'AUTHORISED',
      paidAt: null,
      dueDate: '2026-01-27',
      totalPayments: 0,
      total: 100,
      paymentStatus: null,
    })

    expect(status).toBe('overdue')

    vi.useRealTimers()
  })
})

describe('buildInvoiceTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-28T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes payment processing event when status is processing', () => {
    const timeline = buildInvoiceTimeline({
      issueDate: '2026-01-10',
      dueDate: '2026-02-01',
      paidAt: null,
      paymentStatus: 'processing',
      paymentStatusUpdatedAt: '2026-01-28T12:00:00Z',
      includeXero: false,
    })

    const processingEvent = timeline.find((event) => event.id === 'processing')
    expect(processingEvent).toBeDefined()
    expect(processingEvent?.status).toBe('current')
  })

  it('marks paid event when paid_at is present', () => {
    const timeline = buildInvoiceTimeline({
      issueDate: '2026-01-10',
      dueDate: '2026-02-01',
      paidAt: '2026-01-20T10:00:00Z',
      paymentStatus: 'paid',
      paymentStatusUpdatedAt: '2026-01-20T10:00:00Z',
      includeXero: true,
      xeroStatus: 'PAID',
      lastSyncedAt: '2026-01-21T10:00:00Z',
    })

    const paidEvent = timeline.find((event) => event.id === 'paid')
    expect(paidEvent?.status).toBe('complete')
  })

  it('marks due event as error when overdue', () => {
    const timeline = buildInvoiceTimeline({
      issueDate: '2026-01-10',
      dueDate: '2026-01-20',
      paidAt: null,
      paymentStatus: null,
      includeXero: false,
    })

    const dueEvent = timeline.find((event) => event.id === 'due')
    expect(dueEvent?.status).toBe('error')
  })
})
