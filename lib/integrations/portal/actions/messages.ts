/**
 * Portal Messages
 * Chat message operations for the client portal
 */

'use server'

import { createClient } from '@/utils/supabase/server'
import { createAnonClient } from '@/utils/supabase/anon'
import type { PortalMessage } from '../types'
import { validateTokenForProject } from './tokens'

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
    const supabase = createAnonClient()

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
    console.log('[Portal] postPortalMessage called with projectId:', projectId, 'body length:', body.length)
    const supabase = createAnonClient()

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
        body: body.trim(),
      })
      .select()
      .single()

    if (error || !message) {
      console.log('[Portal] Insert message error:', error)
      return { success: false, error: 'Failed to post message' }
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
  body: string,
  authorId: string
): Promise<{ success: true; message: PortalMessage } | { success: false; error: string }> {
  try {
    const supabase = await createClient()

    // Insert message as owner
    const { data: message, error } = await supabase
      .from('portal_messages')
      .insert({
        project_id: projectId,
        author_type: 'owner',
        author_id: authorId,
        body: body.trim(),
      })
      .select()
      .single()

    if (error || !message) {
      return { success: false, error: 'Failed to post message' }
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
    const supabase = createAnonClient()

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
  projectId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('portal_read_state')
      .upsert(
        {
          project_id: projectId,
          user_type: 'owner',
          user_id: ownerId,
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
