import { describe, expect, it } from 'vitest'
import {
  calculateInvoiceTotals,
  buildXeroInvoicePayload,
  generateInvoiceNumber,
  validateLineItems,
  type InvoiceLineItem,
} from '@/lib/invoices/helpers'

describe('calculateInvoiceTotals', () => {
  it('calculates subtotal correctly for single item', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Web Design', quantity: 1, unitPrice: 1000 },
    ]

    const result = calculateInvoiceTotals(lineItems)

    expect(result.subtotal).toBe(1000)
  })

  it('calculates subtotal correctly for multiple items', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Web Design', quantity: 1, unitPrice: 1000 },
      { description: 'Development', quantity: 10, unitPrice: 150 },
    ]

    const result = calculateInvoiceTotals(lineItems)

    expect(result.subtotal).toBe(2500) // 1000 + (10 * 150)
  })

  it('calculates GST at 10% by default (tax exclusive)', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 1, unitPrice: 1000 },
    ]

    const result = calculateInvoiceTotals(lineItems)

    expect(result.gstAmount).toBe(100) // 10% of 1000
    expect(result.total).toBe(1100) // 1000 + 100
  })

  it('supports custom GST rates', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 1, unitPrice: 1000 },
    ]

    const result = calculateInvoiceTotals(lineItems, 0.15) // 15% GST

    expect(result.gstAmount).toBe(150)
    expect(result.total).toBe(1150)
  })

  it('handles zero GST rate', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 1, unitPrice: 1000 },
    ]

    const result = calculateInvoiceTotals(lineItems, 0)

    expect(result.gstAmount).toBe(0)
    expect(result.total).toBe(1000)
  })

  it('rounds to 2 decimal places', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 3, unitPrice: 33.33 },
    ]

    const result = calculateInvoiceTotals(lineItems)

    expect(result.subtotal).toBe(99.99)
    expect(result.gstAmount).toBe(10) // 9.999 rounded
    expect(result.total).toBe(109.99)
  })

  it('handles empty line items', () => {
    const result = calculateInvoiceTotals([])

    expect(result.subtotal).toBe(0)
    expect(result.gstAmount).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('buildXeroInvoicePayload', () => {
  const baseParams = {
    contactId: 'contact-123',
    contactName: 'Acme Corp',
    lineItems: [
      { description: 'Web Design', quantity: 1, unitPrice: 1000 },
    ],
    invoiceNumber: 'INV-0001',
    issueDate: '2026-01-24',
    dueDate: '2026-02-07',
  }

  it('creates invoice with ACCREC type (sales invoice)', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    expect(payload.Type).toBe('ACCREC')
  })

  it('sets status to DRAFT', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    expect(payload.Status).toBe('DRAFT')
  })

  it('sets LineAmountTypes to Exclusive (GST exclusive)', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    expect(payload.LineAmountTypes).toBe('Exclusive')
  })

  it('sets TaxType to OUTPUT (GST on Income) for all line items', () => {
    const params = {
      ...baseParams,
      lineItems: [
        { description: 'Item 1', quantity: 1, unitPrice: 100 },
        { description: 'Item 2', quantity: 2, unitPrice: 50 },
      ],
    }

    const payload = buildXeroInvoicePayload(params)

    payload.LineItems.forEach((item) => {
      expect(item.TaxType).toBe('OUTPUT')
    })
  })

  it('sets AccountCode to 200 (default sales account)', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    payload.LineItems.forEach((item) => {
      expect(item.AccountCode).toBe('200')
    })
  })

  it('includes contact details', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    expect(payload.Contact.ContactID).toBe('contact-123')
    expect(payload.Contact.Name).toBe('Acme Corp')
  })

  it('includes dates', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    expect(payload.DateString).toBe('2026-01-24')
    expect(payload.DueDateString).toBe('2026-02-07')
  })

  it('includes invoice number as reference', () => {
    const payload = buildXeroInvoicePayload(baseParams)

    expect(payload.Reference).toBe('INV-0001')
  })

  it('maps line items correctly', () => {
    const params = {
      ...baseParams,
      lineItems: [
        { description: 'Design Work', quantity: 5, unitPrice: 150 },
      ],
    }

    const payload = buildXeroInvoicePayload(params)

    expect(payload.LineItems[0].Description).toBe('Design Work')
    expect(payload.LineItems[0].Quantity).toBe(5)
    expect(payload.LineItems[0].UnitAmount).toBe(150)
  })
})

describe('generateInvoiceNumber', () => {
  it('generates first invoice number', () => {
    const result = generateInvoiceNumber('INV', null)

    expect(result).toBe('INV-0001')
  })

  it('increments from last invoice number', () => {
    const result = generateInvoiceNumber('INV', 'INV-0042')

    expect(result).toBe('INV-0043')
  })

  it('handles custom prefix', () => {
    const result = generateInvoiceNumber('JARVE', 'JARVE-0099')

    expect(result).toBe('JARVE-0100')
  })

  it('pads numbers to 4 digits', () => {
    const result = generateInvoiceNumber('INV', 'INV-0009')

    expect(result).toBe('INV-0010')
  })

  it('handles malformed last number', () => {
    const result = generateInvoiceNumber('INV', 'invalid')

    expect(result).toBe('INV-0001')
  })
})

describe('validateLineItems', () => {
  it('validates valid line items', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 1, unitPrice: 100 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects empty line items array', () => {
    const result = validateLineItems([])

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one line item is required')
  })

  it('rejects line item with empty description', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: '', quantity: 1, unitPrice: 100 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('description is required')
  })

  it('rejects line item with zero quantity', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 0, unitPrice: 100 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('quantity must be greater than 0')
  })

  it('rejects line item with negative quantity', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: -1, unitPrice: 100 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('quantity must be greater than 0')
  })

  it('rejects line item with negative unit price', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Service', quantity: 1, unitPrice: -50 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('unit price must be 0 or greater')
  })

  it('allows zero unit price (free item)', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: 'Free consultation', quantity: 1, unitPrice: 0 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(true)
  })

  it('collects multiple validation errors', () => {
    const lineItems: InvoiceLineItem[] = [
      { description: '', quantity: 0, unitPrice: -10 },
    ]

    const result = validateLineItems(lineItems)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
