import { describe, expect, it } from 'vitest'

// Types for testing
interface PricingLineItem {
  id: string
  label: string
  qty: number
  unitPrice: number
  total: number
}

interface ProposalPricing {
  lineItems: PricingLineItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  total: number
}

// Helper functions extracted for testing
function calculatePricing(lineItems: PricingLineItem[], gstRate: number = 0.10): ProposalPricing {
  const subtotal = lineItems.reduce((sum, item) => {
    const itemTotal = item.qty * item.unitPrice
    return sum + itemTotal
  }, 0)
  const gstAmount = subtotal * gstRate
  const total = subtotal + gstAmount

  return {
    lineItems: lineItems.map(item => ({
      ...item,
      total: item.qty * item.unitPrice
    })),
    subtotal,
    gstRate,
    gstAmount,
    total
  }
}

function validateSignatureInput(input: {
  signerName: string
  signerEmail: string
  signatureSvg: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.signerName || !input.signerName.trim()) {
    errors.push('Signer name is required')
  }

  if (!input.signerEmail || !input.signerEmail.trim()) {
    errors.push('Signer email is required')
  } else if (!input.signerEmail.includes('@')) {
    errors.push('Invalid email format')
  }

  if (!input.signatureSvg || !input.signatureSvg.trim()) {
    errors.push('Signature is required')
  } else if (!input.signatureSvg.includes('<svg')) {
    errors.push('Invalid signature format')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function isValidProposalStatus(status: string): boolean {
  return ['draft', 'sent', 'signed', 'archived'].includes(status)
}

function canEditProposal(status: string): boolean {
  return status === 'draft' || status === 'sent'
}

function canSignProposal(status: string): boolean {
  return status === 'sent'
}

function incrementVersion(currentVersion: number): number {
  return currentVersion + 1
}

describe('Proposal Pricing Calculations', () => {
  it('calculates line item totals correctly', () => {
    const lineItems: PricingLineItem[] = [
      { id: '1', label: 'Design', qty: 10, unitPrice: 100, total: 0 },
      { id: '2', label: 'Development', qty: 20, unitPrice: 150, total: 0 }
    ]

    const result = calculatePricing(lineItems)

    expect(result.lineItems[0].total).toBe(1000)
    expect(result.lineItems[1].total).toBe(3000)
  })

  it('calculates subtotal correctly', () => {
    const lineItems: PricingLineItem[] = [
      { id: '1', label: 'Design', qty: 10, unitPrice: 100, total: 0 },
      { id: '2', label: 'Development', qty: 20, unitPrice: 150, total: 0 }
    ]

    const result = calculatePricing(lineItems)

    expect(result.subtotal).toBe(4000)
  })

  it('calculates GST at 10% correctly', () => {
    const lineItems: PricingLineItem[] = [
      { id: '1', label: 'Design', qty: 10, unitPrice: 100, total: 0 }
    ]

    const result = calculatePricing(lineItems, 0.10)

    expect(result.gstAmount).toBe(100)
    expect(result.total).toBe(1100)
  })

  it('handles custom GST rate', () => {
    const lineItems: PricingLineItem[] = [
      { id: '1', label: 'Design', qty: 10, unitPrice: 100, total: 0 }
    ]

    const result = calculatePricing(lineItems, 0.15)

    expect(result.gstAmount).toBe(150)
    expect(result.total).toBe(1150)
  })

  it('handles empty line items', () => {
    const result = calculatePricing([])

    expect(result.subtotal).toBe(0)
    expect(result.gstAmount).toBe(0)
    expect(result.total).toBe(0)
  })

  it('handles zero quantity', () => {
    const lineItems: PricingLineItem[] = [
      { id: '1', label: 'Design', qty: 0, unitPrice: 100, total: 0 }
    ]

    const result = calculatePricing(lineItems)

    expect(result.subtotal).toBe(0)
  })
})

describe('Signature Input Validation', () => {
  it('validates complete signature input', () => {
    const result = validateSignatureInput({
      signerName: 'John Doe',
      signerEmail: 'john@example.com',
      signatureSvg: '<svg>signature data</svg>'
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('requires signer name', () => {
    const result = validateSignatureInput({
      signerName: '',
      signerEmail: 'john@example.com',
      signatureSvg: '<svg>signature data</svg>'
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Signer name is required')
  })

  it('requires signer email', () => {
    const result = validateSignatureInput({
      signerName: 'John Doe',
      signerEmail: '',
      signatureSvg: '<svg>signature data</svg>'
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Signer email is required')
  })

  it('validates email format', () => {
    const result = validateSignatureInput({
      signerName: 'John Doe',
      signerEmail: 'not-an-email',
      signatureSvg: '<svg>signature data</svg>'
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid email format')
  })

  it('requires signature SVG', () => {
    const result = validateSignatureInput({
      signerName: 'John Doe',
      signerEmail: 'john@example.com',
      signatureSvg: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Signature is required')
  })

  it('validates signature format', () => {
    const result = validateSignatureInput({
      signerName: 'John Doe',
      signerEmail: 'john@example.com',
      signatureSvg: 'not svg data'
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid signature format')
  })

  it('collects multiple errors', () => {
    const result = validateSignatureInput({
      signerName: '',
      signerEmail: '',
      signatureSvg: ''
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })
})

describe('Proposal Status Validation', () => {
  it('validates draft status', () => {
    expect(isValidProposalStatus('draft')).toBe(true)
  })

  it('validates sent status', () => {
    expect(isValidProposalStatus('sent')).toBe(true)
  })

  it('validates signed status', () => {
    expect(isValidProposalStatus('signed')).toBe(true)
  })

  it('validates archived status', () => {
    expect(isValidProposalStatus('archived')).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(isValidProposalStatus('invalid')).toBe(false)
    expect(isValidProposalStatus('pending')).toBe(false)
    expect(isValidProposalStatus('')).toBe(false)
  })
})

describe('Proposal Edit Permissions', () => {
  it('allows editing draft proposals', () => {
    expect(canEditProposal('draft')).toBe(true)
  })

  it('allows editing sent proposals', () => {
    expect(canEditProposal('sent')).toBe(true)
  })

  it('prevents editing signed proposals', () => {
    expect(canEditProposal('signed')).toBe(false)
  })

  it('prevents editing archived proposals', () => {
    expect(canEditProposal('archived')).toBe(false)
  })
})

describe('Proposal Signing Permissions', () => {
  it('prevents signing draft proposals', () => {
    expect(canSignProposal('draft')).toBe(false)
  })

  it('allows signing sent proposals', () => {
    expect(canSignProposal('sent')).toBe(true)
  })

  it('prevents signing already signed proposals', () => {
    expect(canSignProposal('signed')).toBe(false)
  })

  it('prevents signing archived proposals', () => {
    expect(canSignProposal('archived')).toBe(false)
  })
})

describe('Proposal Versioning', () => {
  it('increments version from 1', () => {
    expect(incrementVersion(1)).toBe(2)
  })

  it('increments version correctly', () => {
    expect(incrementVersion(5)).toBe(6)
    expect(incrementVersion(10)).toBe(11)
    expect(incrementVersion(99)).toBe(100)
  })
})
