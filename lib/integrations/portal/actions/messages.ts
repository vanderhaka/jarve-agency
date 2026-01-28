/**
 * Portal Messages
 * Chat message operations for the client portal
 */

'use server'

import { requireEmployee } from '@/lib/auth/require-employee'
import { createPortalServiceClient } from '@/utils/supabase/portal-service'
import type { PortalMessage } from '../types'
import { validateTokenForProject } from './tokens'
import { broadcastPortalMessage } from '../realtime-server'

const MAX_MESSAGE_LENGTH = 2000

/**
 * Get messages for a project
 */
export async function getPortalMessages(
  token: string,
  projectId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ success: true; messages: PortalMessage[] } | { success: false; error: string }> {
  try {
    const supabase = createPortalServiceClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Fetch messages - order descending to get the N most recent, then reverse for chronological display
    const { data: messages, error } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return { success: false, error: 'Failed to fetch messages' }
    }

    // Reverse to restore chronological order (oldest to newest) for display
    return { success: true, messages: (messages as PortalMessage[]).reverse() }
  } catch (error) {
    console.error('Error getting portal messages:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Post a new message to a project chat
 */
export async function postPortalMessage(
  token: string,
  projectId: string,
  body: string
): Promise<{ success: true; message: PortalMessage } | { success: false; error: string }> {
  try {
    const trimmed = body.trim()
    if (!trimmed) {
      return { success: false, error: 'Message cannot be empty' }
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { success: false, error: 'Message is too long' }
    }

    console.log('[Portal] postPortalMessage called with projectId:', projectId, 'body length:', body.length)
    const supabase = createPortalServiceClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      console.log('[Portal] Token validation failed:', validation.error)
      return { success: false, error: validation.error }
    }
    console.log('[Portal] Token validated, clientUserId:', validation.clientUserId)

    // Insert message
    const { data: message, error } = await supabase
      .from('portal_messages')
      .insert({
        project_id: projectId,
        author_type: 'client',
        author_id: validation.clientUserId,
        body: trimmed,
      })
      .select()
      .single()

    if (error || !message) {
      console.log('[Portal] Insert message error:', error)
      return { success: false, error: 'Failed to post message' }
    }

    if (process.env.PORTAL_MESSAGES_WEBHOOK_MODE !== 'webhook') {
      const broadcastResult = await broadcastPortalMessage(message as PortalMessage)
      if (!broadcastResult.ok) {
        console.warn('[Portal] Broadcast failed:', broadcastResult.error)
      }
    }

    console.log('[Portal] Message posted successfully:', message.id)
    return { success: true, message: message as PortalMessage }
  } catch (error) {
    console.error('Error posting portal message:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Post a message as the owner (admin side)
 */
export async function postOwnerMessage(
  projectId: string,
  body: string
): Promise<{ success: true; message: PortalMessage } | { success: false; error: string }> {
  try {
    const trimmed = body.trim()
    if (!trimmed) {
      return { success: false, error: 'Message cannot be empty' }
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { success: false, error: 'Message is too long' }
    }

    const { supabase, user } = await requireEmployee()

    // Insert message as owner
    const { data: message, error } = await supabase
      .from('portal_messages')
      .insert({
        project_id: projectId,
        author_type: 'owner',
        author_id: user.id,
        body: trimmed,
      })
      .select()
      .single()

    if (error || !message) {
      return { success: false, error: 'Failed to post message' }
    }

    if (process.env.PORTAL_MESSAGES_WEBHOOK_MODE !== 'webhook') {
      const broadcastResult = await broadcastPortalMessage(message as PortalMessage)
      if (!broadcastResult.ok) {
        console.warn('[Portal] Broadcast failed:', broadcastResult.error)
      }
    }

    return { success: true, message: message as PortalMessage }
  } catch (error) {
    console.error('Error posting owner message:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update read state for a user on a project
 */
export async function updateReadState(
  token: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createPortalServiceClient()

    // Validate token
    const validation = await validateTokenForProject(supabase, token, projectId)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Upsert read state
    const { error } = await supabase
      .from('portal_read_state')
      .upsert(
        {
          project_id: projectId,
          user_type: 'client',
          user_id: validation.clientUserId,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,user_type,user_id',
        }
      )

    if (error) {
      return { success: false, error: 'Failed to update read state' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating read state:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update read state as owner (admin side)
 */
export async function updateOwnerReadState(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireEmployee()

    const { error } = await supabase
      .from('portal_read_state')
      .upsert(
        {
          project_id: projectId,
          user_type: 'owner',
          user_id: user.id,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: 'project_id,user_type,user_id',
        }
      )

    if (error) {
      return { success: false, error: 'Failed to update read state' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating owner read state:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
