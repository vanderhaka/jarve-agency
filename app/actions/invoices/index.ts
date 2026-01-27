// ============================================================
// Invoice Actions - Re-exports for backward compatibility
// ============================================================

// Types
export type {
  InvoiceLineItem,
  CreateInvoicePayload,
  InvoiceWithDetails,
} from './types'

// CRUD operations
export { createInvoice, getProjectInvoices, getAllInvoices } from './crud'

// Xero sync (public actions with auth)
// NOTE: createOrGetXeroContact, postPaymentToXero are internal helpers
// and intentionally NOT exported here to prevent unauthenticated access
export {
  syncInvoiceToXero,
  syncInvoiceStatus,
} from './xero-sync'

// NOTE: syncInvoicePdf is internal (called from syncInvoiceStatus)
// and intentionally NOT exported here to prevent unauthenticated access

// Payments
export { markInvoicePaid } from './payments'

// Helpers
export { mapInvoiceToDetails } from './helpers'
