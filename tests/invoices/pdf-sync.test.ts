import { describe, expect, it } from 'vitest'
import {
  generatePdfStoragePath,
  buildContractDocEntry,
  shouldSyncPdf,
  isValidPdfBuffer,
  type PdfSyncParams,
} from '@/lib/invoices/pdf-sync-helpers'

describe('generatePdfStoragePath', () => {
  it('generates path under project folder when projectId is provided', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123',
      invoiceNumber: 'INV-0042',
      clientId: 'client-123',
      projectId: 'project-456',
    }

    const result = generatePdfStoragePath(params)

    expect(result).toBe('projects/project-456/invoices/INV-0042.pdf')
  })

  it('generates path under invoices folder when no projectId', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123',
      invoiceNumber: 'INV-0042',
      clientId: 'client-123',
      projectId: null,
    }

    const result = generatePdfStoragePath(params)

    expect(result).toBe('invoices/INV-0042.pdf')
  })

  it('uses invoiceId as fallback when no invoice number', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123',
      invoiceNumber: null,
      clientId: 'client-123',
      projectId: null,
    }

    const result = generatePdfStoragePath(params)

    expect(result).toBe('invoices/invoice-inv-uuid-123.pdf')
  })

  it('sanitizes special characters in invoice number', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123',
      invoiceNumber: 'INV/2026:001',
      clientId: 'client-123',
      projectId: null,
    }

    const result = generatePdfStoragePath(params)

    expect(result).toBe('invoices/INV_2026_001.pdf')
  })
})

describe('buildContractDocEntry', () => {
  it('builds complete contract doc entry with invoice number', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123',
      invoiceNumber: 'INV-0042',
      clientId: 'client-123',
      projectId: 'project-456',
    }
    const filePath = 'projects/project-456/invoices/INV-0042.pdf'

    const result = buildContractDocEntry(params, filePath)

    expect(result).toEqual({
      clientId: 'client-123',
      projectId: 'project-456',
      docType: 'invoice',
      title: 'Invoice INV-0042',
      filePath: 'projects/project-456/invoices/INV-0042.pdf',
      sourceTable: 'invoices',
      sourceId: 'inv-uuid-123',
    })
  })

  it('uses invoiceId for title when no invoice number', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123456789',
      invoiceNumber: null,
      clientId: 'client-123',
      projectId: null,
    }
    const filePath = 'invoices/invoice-inv-uuid-123456789.pdf'

    const result = buildContractDocEntry(params, filePath)

    expect(result.title).toBe('Invoice inv-uuid')
  })

  it('handles null client and project IDs', () => {
    const params: PdfSyncParams = {
      invoiceId: 'inv-uuid-123',
      invoiceNumber: 'INV-0001',
      clientId: null,
      projectId: null,
    }
    const filePath = 'invoices/INV-0001.pdf'

    const result = buildContractDocEntry(params, filePath)

    expect(result.clientId).toBeNull()
    expect(result.projectId).toBeNull()
  })
})

describe('shouldSyncPdf', () => {
  it('returns true for SUBMITTED status', () => {
    expect(shouldSyncPdf('SUBMITTED')).toBe(true)
  })

  it('returns true for AUTHORISED status', () => {
    expect(shouldSyncPdf('AUTHORISED')).toBe(true)
  })

  it('returns true for PAID status', () => {
    expect(shouldSyncPdf('PAID')).toBe(true)
  })

  it('returns true for VOIDED status', () => {
    expect(shouldSyncPdf('VOIDED')).toBe(true)
  })

  it('returns false for DRAFT status', () => {
    expect(shouldSyncPdf('DRAFT')).toBe(false)
  })

  it('returns false for DELETED status', () => {
    expect(shouldSyncPdf('DELETED')).toBe(false)
  })

  it('returns false for null status', () => {
    expect(shouldSyncPdf(null)).toBe(false)
  })

  it('returns false for undefined status', () => {
    expect(shouldSyncPdf(undefined)).toBe(false)
  })

  it('handles lowercase status', () => {
    expect(shouldSyncPdf('submitted')).toBe(true)
    expect(shouldSyncPdf('paid')).toBe(true)
  })
})

describe('isValidPdfBuffer', () => {
  it('returns true for valid PDF buffer', () => {
    // PDF files start with %PDF-
    const pdfBuffer = Buffer.from('%PDF-1.4\n...')

    expect(isValidPdfBuffer(pdfBuffer)).toBe(true)
  })

  it('returns false for null buffer', () => {
    expect(isValidPdfBuffer(null)).toBe(false)
  })

  it('returns false for empty buffer', () => {
    expect(isValidPdfBuffer(Buffer.from(''))).toBe(false)
  })

  it('returns false for buffer shorter than 5 bytes', () => {
    expect(isValidPdfBuffer(Buffer.from('%PDF'))).toBe(false)
  })

  it('returns false for non-PDF content', () => {
    expect(isValidPdfBuffer(Buffer.from('Hello World'))).toBe(false)
    expect(isValidPdfBuffer(Buffer.from('<html>'))).toBe(false)
    expect(isValidPdfBuffer(Buffer.from('{"error":"Not found"}'))).toBe(false)
  })

  it('handles buffer with only PDF header', () => {
    expect(isValidPdfBuffer(Buffer.from('%PDF-'))).toBe(true)
  })
})

describe('PDF sync integration scenarios', () => {
  it('generates correct path and entry for a typical invoice', () => {
    const params: PdfSyncParams = {
      invoiceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      invoiceNumber: 'JARVE-0100',
      clientId: 'client-abc-123',
      projectId: 'project-xyz-789',
    }

    // 1. Check if PDF sync should happen (only for non-DRAFT)
    expect(shouldSyncPdf('DRAFT')).toBe(false)
    expect(shouldSyncPdf('AUTHORISED')).toBe(true)

    // 2. Generate storage path
    const storagePath = generatePdfStoragePath(params)
    expect(storagePath).toBe('projects/project-xyz-789/invoices/JARVE-0100.pdf')

    // 3. Build contract_docs entry
    const docEntry = buildContractDocEntry(params, storagePath)
    expect(docEntry.docType).toBe('invoice')
    expect(docEntry.sourceTable).toBe('invoices')
    expect(docEntry.sourceId).toBe(params.invoiceId)
  })

  it('handles invoice without project correctly', () => {
    const params: PdfSyncParams = {
      invoiceId: 'standalone-invoice-id',
      invoiceNumber: 'INV-0001',
      clientId: 'client-only',
      projectId: null,
    }

    const storagePath = generatePdfStoragePath(params)
    expect(storagePath).toBe('invoices/INV-0001.pdf')

    const docEntry = buildContractDocEntry(params, storagePath)
    expect(docEntry.projectId).toBeNull()
    expect(docEntry.clientId).toBe('client-only')
  })
})
