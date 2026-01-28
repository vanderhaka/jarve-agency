import type { PortalInvoiceStatus } from '@/lib/integrations/portal/types'

export type InvoicePaymentStatus = 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded' | null

export type InvoiceTimelineEventStatus = 'complete' | 'current' | 'pending' | 'error'

export interface InvoiceTimelineEvent {
  id: string
  label: string
  timestamp: string | null
  status: InvoiceTimelineEventStatus
  detail?: string
}

export interface InvoiceTimelineInput {
  issueDate?: string | null
  dueDate?: string | null
  paidAt?: string | null
  paymentStatus?: InvoicePaymentStatus | string | null
  paymentStatusUpdatedAt?: string | null
  xeroStatus?: string | null
  lastSyncedAt?: string | null
  createdAt?: string | null
  includeXero?: boolean
}

export function normalizePaymentStatus(status?: string | null): InvoicePaymentStatus {
  if (!status) return null
  switch (status.toLowerCase()) {
    case 'unpaid':
      return 'unpaid'
    case 'processing':
      return 'processing'
    case 'paid':
      return 'paid'
    case 'failed':
      return 'failed'
    case 'refunded':
      return 'refunded'
    default:
      return null
  }
}

export function mapPortalInvoiceStatus(params: {
  xeroStatus: string | null
  paidAt: string | null
  dueDate: string | null
  totalPayments: number
  total: number | null
  paymentStatus?: InvoicePaymentStatus | string | null
}): PortalInvoiceStatus {
  const paymentStatus = normalizePaymentStatus(params.paymentStatus)

  if (params.paidAt) {
    return 'paid'
  }

  if (params.total && params.totalPayments >= params.total) {
    return 'paid'
  }

  if (params.total && params.totalPayments > 0 && params.totalPayments < params.total) {
    return 'partially_paid'
  }

  if (paymentStatus === 'paid') {
    return 'paid'
  }

  if (paymentStatus === 'failed') {
    return 'payment_failed'
  }

  if (paymentStatus === 'processing') {
    return 'processing'
  }

  if (paymentStatus === 'refunded') {
    return 'refunded'
  }

  const status = params.xeroStatus?.toUpperCase()

  switch (status) {
    case 'PAID':
      return 'paid'
    case 'VOIDED':
    case 'DELETED':
      return 'voided'
    case 'DRAFT':
      return 'draft'
    case 'SUBMITTED':
    case 'AUTHORISED':
      if (params.dueDate) {
        const due = new Date(params.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (due < today) {
          return 'overdue'
        }
      }
      return 'sent'
    default:
      return 'draft'
  }
}

export function buildInvoiceTimeline(input: InvoiceTimelineInput): InvoiceTimelineEvent[] {
  const events: InvoiceTimelineEvent[] = []
  const issuedAt = input.issueDate || input.createdAt || null
  const paidAt = input.paidAt || null
  const paymentStatus = normalizePaymentStatus(input.paymentStatus)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  events.push({
    id: 'issued',
    label: 'Issued',
    timestamp: issuedAt,
    status: issuedAt ? 'complete' : 'pending',
  })

  if (input.dueDate) {
    const due = new Date(input.dueDate)
    let status: InvoiceTimelineEventStatus = 'pending'
    if (paidAt || paymentStatus === 'paid') {
      status = 'complete'
    } else if (due < today) {
      status = 'error'
    } else {
      status = 'current'
    }

    events.push({
      id: 'due',
      label: 'Due',
      timestamp: input.dueDate,
      status,
    })
  }

  if (paymentStatus === 'processing') {
    events.push({
      id: 'processing',
      label: 'Payment processing',
      timestamp: input.paymentStatusUpdatedAt || null,
      status: 'current',
      detail: 'Awaiting confirmation from payment provider',
    })
  }

  if (paymentStatus === 'failed') {
    events.push({
      id: 'failed',
      label: 'Payment failed',
      timestamp: input.paymentStatusUpdatedAt || null,
      status: 'error',
    })
  }

  if (paidAt || paymentStatus === 'paid') {
    events.push({
      id: 'paid',
      label: 'Paid',
      timestamp: paidAt || input.paymentStatusUpdatedAt || null,
      status: 'complete',
    })
  }

  if (input.includeXero) {
    const xeroPaid = input.xeroStatus?.toUpperCase() === 'PAID'
    const status: InvoiceTimelineEventStatus = xeroPaid
      ? 'complete'
      : paidAt
        ? 'current'
        : 'pending'

    events.push({
      id: 'xero',
      label: xeroPaid ? 'Xero marked paid' : 'Xero sync',
      timestamp: input.lastSyncedAt || null,
      status,
    })
  }

  return events
}
