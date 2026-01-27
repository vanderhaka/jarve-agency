// ============================================================
// Types
// ============================================================

export interface ProposalSection {
  id: string
  type: 'text' | 'list' | 'pricing' | 'image'
  title: string
  body?: string
  items?: string[]
  order: number
}

export interface PricingLineItem {
  id: string
  label: string
  description?: string
  qty: number
  unitPrice: number
  total: number
}

export interface ProposalContent {
  sections: ProposalSection[]
  pricing: {
    lineItems: PricingLineItem[]
    subtotal: number
    gstRate: number
    gstAmount: number
    total: number
  }
  terms: string
}

export interface CreateProposalInput {
  leadId?: string
  projectId?: string
  clientId?: string
  title: string
  templateId?: string
}

export interface UpdateProposalInput {
  content: ProposalContent
}

export interface SendProposalInput {
  clientUserId: string
  version?: number // If not provided, uses current version
}

export interface SignProposalInput {
  token: string
  signerName: string
  signerEmail: string
  signatureSvg: string
  ipAddress?: string
}
