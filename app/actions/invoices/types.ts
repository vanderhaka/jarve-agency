// ============================================================
// Invoice Types
// ============================================================

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface CreateInvoicePayload {
  clientId: string
  projectId?: string
  lineItems: InvoiceLineItem[]
  issueDate?: string
  dueDate?: string
  notes?: string
}

export interface InvoiceWithDetails {
  id: string
  clientId: string | null
  projectId: string | null
  xeroInvoiceId: string | null
  xeroStatus: string | null
  invoiceNumber: string | null
  currency: string
  subtotal: number | null
  gstRate: number
  gstAmount: number | null
  total: number | null
  issueDate: string | null
  dueDate: string | null
  paidAt: string | null
  paymentLinkUrl: string | null
  lastSyncedAt: string | null
  createdAt: string
  client?: {
    id: string
    name: string
    email: string | null
    xeroContactId: string | null
  }
  project?: {
    id: string
    name: string
  }
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    sortOrder: number
  }>
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    method: string | null
    reference: string | null
  }>
}
