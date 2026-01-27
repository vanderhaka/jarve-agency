import { z } from 'zod'

/**
 * Sanitize SVG to prevent XSS attacks.
 * Removes script tags, event handlers, and other dangerous elements.
 * 
 * @remarks
 * This function handles various XSS attack vectors including:
 * - Script tags
 * - Event handlers (both quoted and unquoted attribute values)
 * - javascript: and data: URLs
 * - SVG-specific vectors like xlink:href, foreignObject, and external use elements
 */
export function sanitizeSvg(svg: string): string {
  // Remove script tags
  let sanitized = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (on*) - handles:
  // - Quoted values: onclick="alert(1)" or onclick='alert(1)'
  // - Unquoted values: onclick=alert(1)
  // - Various separators before attribute: space, tab, newline, or /
  // Pattern breakdown:
  //   [\s/] - whitespace or / (for <svg/onclick=...)
  //   on\w+ - event handler name (onclick, onerror, onload, etc.)
  //   \s*=\s* - equals with optional whitespace
  //   (?:"[^"]*"|'[^']*'|[^\s/>]+) - quoted value OR unquoted value (until whitespace, /, or >)
  sanitized = sanitized.replace(/[\s/]on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s/>]+)/gi, '')
  
  // Remove javascript: URLs (with optional whitespace/newlines after colon)
  sanitized = sanitized.replace(/javascript\s*:/gi, '')
  
  // Remove data: URLs in href/src (can contain scripts) - handles quoted and unquoted
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*(?:"data:[^"]*"|'data:[^']*'|data:[^\s/>]+)/gi, '')
  
  // Remove xlink:href with javascript/data (SVG-specific attack vector)
  sanitized = sanitized.replace(/xlink:href\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*'|(?:javascript|data):[^\s/>]+)/gi, '')
  
  // Remove use elements pointing to external resources (can load malicious SVG)
  sanitized = sanitized.replace(/<use\b[^>]*href\s*=\s*["'][^#][^"']*["'][^>]*>/gi, '')
  
  // Remove foreignObject (can contain HTML/scripts)
  sanitized = sanitized.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, '')
  
  // Remove iframe, embed, object elements
  sanitized = sanitized.replace(/<(?:iframe|embed|object)\b[^>]*>[\s\S]*?<\/(?:iframe|embed|object)>/gi, '')
  sanitized = sanitized.replace(/<(?:iframe|embed|object)\b[^>]*\/?>/gi, '')
  
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
})

export type SignProposalInput = z.infer<typeof SignProposalSchema>

// ============================================================
// Sign MSA (PUBLIC - requires XSS protection)
// ============================================================

export const SignMSASchema = z.object({
  token: z.string().min(1),
  signerName: z.string().min(1).max(200),
  signerEmail: z.string().email(),
  signatureSvg: z.string().transform(sanitizeSvg),
})

export type SignMSAInput = z.infer<typeof SignMSASchema>
