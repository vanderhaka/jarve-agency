/**
 * Invoice Helpers
 * Pure functions for invoice calculations and Xero payload building
 * These are separated from server actions for testability
 */

import type { XeroInvoice } from '@/lib/integrations/xero/client'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface InvoiceCalculation {
  subtotal: number
  gstAmount: number
  total: number
}

export interface BuildXeroInvoiceParams {
  contactId: string
  contactName: string
  lineItems: InvoiceLineItem[]
  invoiceNumber?: string
  issueDate: string
  dueDate: string
}

/**
 * Calculate invoice totals with GST
 * GST is calculated as tax exclusive (added on top of subtotal)
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  gstRate: number = 0.1
): InvoiceCalculation {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const gstAmount = subtotal * gstRate
  const total = subtotal + gstAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Build Xero invoice payload
 * Creates a Draft invoice with GST exclusive (tax added on top)
 * Uses "GST on Income" (OUTPUT tax type)
 */
export function buildXeroInvoicePayload(params: BuildXeroInvoiceParams): XeroInvoice {
  return {
    Type: 'ACCREC', // Accounts Receivable (sales invoice)
    Contact: {
      ContactID: params.contactId,
      Name: params.contactName,
    },
    DateString: params.issueDate,
    DueDateString: params.dueDate,
    Status: 'DRAFT',
    LineAmountTypes: 'Exclusive', // GST exclusive - tax added on top
    LineItems: params.lineItems.map((item) => ({
      Description: item.description,
      Quantity: item.quantity,
      UnitAmount: item.unitPrice,
      AccountCode: '200', // Default sales account
      TaxType: 'OUTPUT', // GST on Income
    })),
    Reference: params.invoiceNumber,
  }
}

/**
 * Generate next invoice number
 */
export function generateInvoiceNumber(
  prefix: string,
  lastNumber: string | null
): string {
  let nextNumber = 1

  if (lastNumber) {
    const match = lastNumber.match(/-(\d+)$/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}

/**
 * Validate invoice line items
 */
export function validateLineItems(
  lineItems: InvoiceLineItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!lineItems || lineItems.length === 0) {
    errors.push('At least one line item is required')
    return { valid: false, errors }
  }

  lineItems.forEach((item, index) => {
    if (!item.description || item.description.trim() === '') {
      errors.push(`Line item ${index + 1}: description is required`)
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Line item ${index + 1}: quantity must be greater than 0`)
    }
    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      errors.push(`Line item ${index + 1}: unit price must be 0 or greater`)
    }
  })

  return { valid: errors.length === 0, errors }
}
