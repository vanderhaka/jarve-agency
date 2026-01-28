/**
 * Client Portal Types
 * Types for the client portal system
 *
 * Adapted from jarve-website for jarve-agency CRM
 * Full implementation in Stage 4
 */

/**
 * A client portal token that grants access to project info
 */
export interface ClientPortalToken {
  id: string
  client_user_id: string
  token: string
  created_at: string
  revoked_at: string | null
  last_viewed_at: string | null
  view_count: number
}

/**
 * Result of creating a client portal token
 */
export interface CreateClientPortalTokenResult {
  success: true
  token: ClientPortalToken
  url: string
}

/**
 * Error result from client portal operations
 */
export interface ClientPortalErrorResult {
  success: false
  error: string
}

/**
 * Client portal status for display in admin UI
 */
export interface ClientPortalStatus {
  hasActiveToken: boolean
  token: ClientPortalToken | null
  url: string | null
  viewCount: number
  lastViewedAt: string | null
}

/**
 * Project status in the client portal
 */
export type ProjectStatus =
  | 'proposal_pending'
  | 'proposal_accepted'
  | 'proposal_declined'
  | 'project_active'
  | 'project_completed'

/**
 * Portal message (chat)
 */
export interface PortalMessage {
  id: string
  project_id: string
  author_type: 'owner' | 'client'
  author_id: string | null
  body: string
  created_at: string
}

/**
 * Client upload (file)
 */
export interface ClientUpload {
  id: string
  project_id: string
  uploaded_by_type: 'owner' | 'client'
  uploaded_by_id: string | null
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

/**
 * Portal read state for tracking unread messages
 */
export interface PortalReadState {
  id: string
  project_id: string
  user_type: 'owner' | 'client'
  user_id: string | null
  last_read_at: string | null
}

/**
 * Project summary for portal manifest
 */
export interface PortalProject {
  id: string
  name: string
  status: string
  created_at: string
  unread_count: number
}

/**
 * Client information for portal
 */
export interface PortalClient {
  id: string
  name: string
  company: string | null
}

/**
 * Full portal manifest returned after token validation
 */
export interface PortalManifest {
  clientUser: {
    id: string
    name: string
    email: string
  }
  client: PortalClient
  projects: PortalProject[]
}

/**
 * Contract document for docs vault
 */
export interface ContractDoc {
  id: string
  project_id: string | null
  client_id: string | null
  title: string
  doc_type: 'msa' | 'sow' | 'proposal' | 'contract' | 'invoice' | 'signed'
  file_path: string | null
  created_at: string
  signed_at: string | null
}

// ============================================================
// Portal Invoice Types (Client-Safe)
// ============================================================

/**
 * Invoice status as displayed in the client portal
 * Maps from xero_status but excludes internal statuses
 */
export type PortalInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'voided'

/**
 * Payment method for portal display
 */
export type PortalPaymentMethod = 'stripe' | 'bank_transfer' | 'cash' | 'other'

/**
 * Invoice line item for portal display
 * Excludes: xero_account_code (internal)
 */
export interface PortalInvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}

/**
 * Payment record for portal display
 * Excludes: stripe_payment_intent_id, xero_payment_id, recorded_by (internal)
 */
export interface PortalPayment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  method: PortalPaymentMethod | null
  reference: string | null
  created_at: string
}

/**
 * Invoice for portal display
 * Excludes: xero_invoice_id, xero_status, stripe_payment_intent_id,
 *           stripe_checkout_session_id, last_synced_at, created_by (internal)
 */
export interface PortalInvoice {
  id: string
  client_id: string | null
  project_id: string | null
  invoice_number: string | null
  currency: string
  subtotal: number | null
  gst_rate: number
  gst_amount: number | null
  total: number | null
  issue_date: string | null
  due_date: string | null
  paid_at: string | null
  payment_link_url: string | null
  status: PortalInvoiceStatus
  created_at: string
  updated_at: string
  /** Line items included when fetching invoice details */
  line_items?: PortalInvoiceLineItem[]
  /** Payments included when fetching invoice details */
  payments?: PortalPayment[]
}

/**
 * Summary of invoice for list views (minimal data)
 */
export interface PortalInvoiceSummary {
  id: string
  invoice_number: string | null
  status: PortalInvoiceStatus
  total: number | null
  currency: string
  issue_date: string | null
  due_date: string | null
  paid_at: string | null
}

/**
 * Result of initiating a Stripe payment for an invoice
 */
export interface PortalPaymentInitResult {
  success: true
  checkout_url: string
}

/**
 * Error result from portal payment operations
 */
export interface PortalPaymentErrorResult {
  success: false
  error: string
}
