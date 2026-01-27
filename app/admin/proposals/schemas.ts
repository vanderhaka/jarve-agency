import { z } from 'zod'

/**
 * Sanitize SVG to prevent XSS attacks.
 * Removes script tags, event handlers, and other dangerous elements.
 */
function sanitizeSvg(svg: string): string {
  // Remove script tags
  let sanitized = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Remove event handlers (on*)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '')
  // Remove data: URLs in href/src (can contain scripts)
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']data:[^"']*["']/gi, '')
  return sanitized
}

// ============================================================
// Create Proposal
// ============================================================

export const CreateProposalSchema = z.object({
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  templateId: z.string().uuid().optional(),
})

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>

// ============================================================
// Update Proposal
// ============================================================

const PricingLineItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  qty: z.number().min(0),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
})

const ProposalSectionSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'list', 'pricing', 'image']),
  title: z.string(),
  body: z.string().optional(),
  items: z.array(z.string()).optional(),
  order: z.number(),
})

const ProposalContentSchema = z.object({
  sections: z.array(ProposalSectionSchema),
  pricing: z.object({
    lineItems: z.array(PricingLineItemSchema),
    subtotal: z.number(),
    gstRate: z.number(),
    gstAmount: z.number(),
    total: z.number(),
  }),
  terms: z.string(),
})

export const UpdateProposalSchema = z.object({
  content: ProposalContentSchema,
})

export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>

// ============================================================
// Send Proposal
// ============================================================

export const SendProposalSchema = z.object({
  clientUserId: z.string().uuid(),
  version: z.number().int().positive().optional(),
})

export type SendProposalInput = z.infer<typeof SendProposalSchema>

// ============================================================
// Sign Proposal (PUBLIC - requires XSS protection)
// ============================================================

export const SignProposalSchema = z.object({
  token: z.string().min(1),
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
  signatureSvg: z.string().transform(sanitizeSvg),
  ipAddress: z.string().ip().optional(),
})

export type SignProposalInput = z.infer<typeof SignProposalSchema>
