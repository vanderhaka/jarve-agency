import { z } from 'zod'
import { sanitizeSvg } from '@/app/admin/proposals/schemas'

export type ChangeRequestStatus = 'draft' | 'sent' | 'signed' | 'rejected' | 'archived'

export interface ChangeRequest {
  id: string
  project_id: string
  title: string
  description: string | null
  amount: number
  gst_rate: number
  status: ChangeRequestStatus
  rejected_at: string | null
  rejection_reason: string | null
  signed_at: string | null
  signer_name: string | null
  signer_email: string | null
  signature_svg: string | null
  ip_address: string | null
  portal_token: string | null
  portal_token_expires_at: string | null
  milestone_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateChangeRequestInput {
  project_id: string
  title: string
  description?: string | null
  amount: number
  gst_rate?: number
}

export interface UpdateChangeRequestInput {
  title?: string
  description?: string | null
  amount?: number
  gst_rate?: number
  status?: ChangeRequestStatus
}

// Schema with XSS protection for signature SVG
export const SignChangeRequestSchema = z.object({
  signer_name: z.string().min(1).max(200),
  signer_email: z.string().email(),
  signature_svg: z.string().transform(sanitizeSvg),
  ip_address: z.string().optional(),
})

export type SignChangeRequestInput = z.infer<typeof SignChangeRequestSchema>

export interface RejectChangeRequestInput {
  rejection_reason: string
}
