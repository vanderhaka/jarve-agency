import { createClient } from '@/utils/supabase/server'
import { createMilestone } from '@/lib/milestones/data'
import { randomBytes } from 'crypto'
import type {
  ChangeRequest,
  CreateChangeRequestInput,
  UpdateChangeRequestInput,
  SignChangeRequestInput,
  RejectChangeRequestInput,
} from './types'

/**
 * Generate a secure portal token using cryptographically secure random bytes
 */
function generatePortalToken(): string {
  // Generate 24 random bytes and encode as base64url (URL-safe)
  // 24 bytes = 192 bits of entropy, encoded to 32 characters
  return randomBytes(24)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Get all change requests for a project
 */
export async function getChangeRequestsByProject(projectId: string): Promise<ChangeRequest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getChangeRequestsByProject] Error:', error)
    throw new Error('Failed to fetch change requests')
  }

  return data || []
}

/**
 * Get a single change request by ID
 */
export async function getChangeRequestById(changeRequestId: string): Promise<ChangeRequest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .eq('id', changeRequestId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[getChangeRequestById] Error:', error)
    throw new Error('Failed to fetch change request')
  }

  return data
}

/**
 * Get a change request by portal token (for anonymous signing)
 */
export async function getChangeRequestByToken(token: string): Promise<ChangeRequest | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .eq('portal_token', token)
    .eq('status', 'sent')
    .gt('portal_token_expires_at', new Date().toISOString())
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[getChangeRequestByToken] Error:', error)
    throw new Error('Failed to fetch change request')
  }

  return data
}

/**
 * Create a new change request (draft)
 */
export async function createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .insert({
      ...input,
      gst_rate: input.gst_rate ?? 0.10,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('[createChangeRequest] Error:', error)
    throw new Error('Failed to create change request')
  }

  return data
}

/**
 * Update a change request
 */
export async function updateChangeRequest(
  changeRequestId: string,
  input: UpdateChangeRequestInput
): Promise<ChangeRequest> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .update(input)
    .eq('id', changeRequestId)
    .select()
    .single()

  if (error) {
    console.error('[updateChangeRequest] Error:', error)
    throw new Error('Failed to update change request')
  }

  return data
}

/**
 * Delete a change request (only if draft)
 */
export async function deleteChangeRequest(changeRequestId: string): Promise<void> {
  const supabase = await createClient()

  // Atomically delete only if status is draft (prevents TOCTOU race condition)
  const { error, count } = await supabase
    .from('change_requests')
    .delete({ count: 'exact' })
    .eq('id', changeRequestId)
    .eq('status', 'draft')

  if (error) {
    console.error('[deleteChangeRequest] Error:', error)
    throw new Error('Failed to delete change request')
  }

  // If no rows were deleted, the change request either doesn't exist or isn't a draft
  if (count === 0) {
    throw new Error('Can only delete draft change requests')
  }
}

/**
 * Send a change request for client signing
 * Generates a portal token and marks as 'sent'
 */
export async function sendChangeRequest(changeRequestId: string): Promise<ChangeRequest> {
  const supabase = await createClient()

  const token = generatePortalToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 day expiry

  const { data, error } = await supabase
    .from('change_requests')
    .update({
      status: 'sent',
      portal_token: token,
      portal_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', changeRequestId)
    .eq('status', 'draft') // Can only send drafts
    .select()
    .single()

  if (error) {
    console.error('[sendChangeRequest] Error:', error)
    throw new Error('Failed to send change request')
  }

  return data
}

/**
 * Sign a change request (called from portal)
 * Creates a milestone and marks as signed
 */
export async function signChangeRequest(
  changeRequestId: string,
  input: SignChangeRequestInput
): Promise<ChangeRequest> {
  const supabase = await createClient()

  // Get the change request
  const { data: changeRequest, error: fetchError } = await supabase
    .from('change_requests')
    .select('*')
    .eq('id', changeRequestId)
    .eq('status', 'sent')
    .single()

  if (fetchError || !changeRequest) {
    throw new Error('Change request not found or not available for signing')
  }

  // Create a milestone for this change request
  const milestone = await createMilestone({
    project_id: changeRequest.project_id,
    title: `CR: ${changeRequest.title}`,
    description: changeRequest.description,
    amount: changeRequest.amount,
    gst_rate: changeRequest.gst_rate,
    status: 'active',
  })

  // Update the change request
  const { data, error } = await supabase
    .from('change_requests')
    .update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signer_name: input.signer_name,
      signer_email: input.signer_email,
      signature_svg: input.signature_svg,
      ip_address: input.ip_address || null,
      milestone_id: milestone.id,
      portal_token: null, // Revoke token after signing
      portal_token_expires_at: null,
    })
    .eq('id', changeRequestId)
    .select()
    .single()

  if (error) {
    console.error('[signChangeRequest] Error:', error)
    throw new Error('Failed to sign change request')
  }

  // TODO: In Stage 5, create Xero invoice for the milestone here

  return data
}

/**
 * Reject a change request (called from portal)
 */
export async function rejectChangeRequest(
  changeRequestId: string,
  input: RejectChangeRequestInput
): Promise<ChangeRequest> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: input.rejection_reason,
      portal_token: null, // Revoke token
      portal_token_expires_at: null,
    })
    .eq('id', changeRequestId)
    .eq('status', 'sent') // Can only reject sent requests
    .select()
    .single()

  if (error) {
    console.error('[rejectChangeRequest] Error:', error)
    throw new Error('Failed to reject change request')
  }

  return data
}

/**
 * Archive a change request
 */
export async function archiveChangeRequest(changeRequestId: string): Promise<ChangeRequest> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .update({
      status: 'archived',
      portal_token: null,
      portal_token_expires_at: null,
    })
    .eq('id', changeRequestId)
    .select()
    .single()

  if (error) {
    console.error('[archiveChangeRequest] Error:', error)
    throw new Error('Failed to archive change request')
  }

  return data
}

/**
 * Get change request stats for a project
 */
export async function getChangeRequestStats(projectId: string): Promise<{
  total: number
  draft: number
  sent: number
  signed: number
  rejected: number
  totalAmount: number
  signedAmount: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_requests')
    .select('status, amount')
    .eq('project_id', projectId)
    .neq('status', 'archived')

  if (error) {
    console.error('[getChangeRequestStats] Error:', error)
    throw new Error('Failed to get change request stats')
  }

  const stats = {
    total: data.length,
    draft: 0,
    sent: 0,
    signed: 0,
    rejected: 0,
    totalAmount: 0,
    signedAmount: 0,
  }

  for (const cr of data) {
    stats.totalAmount += Number(cr.amount)
    if (cr.status === 'draft') stats.draft++
    if (cr.status === 'sent') stats.sent++
    if (cr.status === 'signed') {
      stats.signed++
      stats.signedAmount += Number(cr.amount)
    }
    if (cr.status === 'rejected') stats.rejected++
  }

  return stats
}
