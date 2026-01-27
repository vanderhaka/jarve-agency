/**
 * PDF Sync Helpers
 * Pure functions for PDF sync operations
 * These are separated from server actions for testability
 */

export interface ContractDocEntry {
  clientId: string | null
  projectId: string | null
  docType: 'invoice'
  title: string
  filePath: string
  sourceTable: 'invoices'
  sourceId: string
}

export interface PdfSyncParams {
  invoiceId: string
  invoiceNumber: string | null
  clientId: string | null
  projectId: string | null
}

/**
 * Generate the storage path for an invoice PDF
 */
export function generatePdfStoragePath(params: PdfSyncParams): string {
  const { invoiceId, invoiceNumber, projectId } = params
  const fileName = invoiceNumber
    ? `${invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`
    : `invoice-${invoiceId}.pdf`

  // Store under project folder if available, otherwise under invoices folder
  if (projectId) {
    return `projects/${projectId}/invoices/${fileName}`
  }
  return `invoices/${fileName}`
}

/**
 * Build contract_docs entry for an invoice PDF
 */
export function buildContractDocEntry(params: PdfSyncParams, filePath: string): ContractDocEntry {
  const title = params.invoiceNumber
    ? `Invoice ${params.invoiceNumber}`
    : `Invoice ${params.invoiceId.slice(0, 8)}`

  return {
    clientId: params.clientId,
    projectId: params.projectId,
    docType: 'invoice',
    title,
    filePath,
    sourceTable: 'invoices',
    sourceId: params.invoiceId,
  }
}

/**
 * Check if PDF sync should be performed
 * Only sync if invoice is in a status where PDF is available (not DRAFT)
 */
export function shouldSyncPdf(xeroStatus: string | null | undefined): boolean {
  if (!xeroStatus) return false

  // Xero only generates PDFs for invoices that have been at least SUBMITTED
  const pdfAvailableStatuses = ['SUBMITTED', 'AUTHORISED', 'PAID', 'VOIDED']
  return pdfAvailableStatuses.includes(xeroStatus.toUpperCase())
}

/**
 * Validate PDF buffer
 * Checks if the buffer appears to be a valid PDF
 */
export function isValidPdfBuffer(buffer: Buffer | null): boolean {
  if (!buffer || buffer.length < 5) return false

  // Check for PDF magic bytes (%PDF-)
  const header = buffer.slice(0, 5).toString('ascii')
  return header === '%PDF-'
}
