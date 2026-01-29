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
 * Get unread messages with preview for the admin messages bell
 */
export async function getUnreadMessagesWithPreview(): Promise<{
  success: true
  data: {
    projectId: string
    projectName: string
    unreadCount: number
    latestMessageAt: string
    latestMessageBody: string
  }[]
} | { success: false; error: string }> {
  try {
    await requireEmployee()

    const supabase = createPortalServiceClient()

    const { data: messages } = await supabase
      .from('portal_messages')
      .select(`
        project_id,
        body,
        created_at,
        agency_projects!inner(name)
      `)
      .eq('author_type', 'client')
      .order('created_at', { ascending: false })

    if (!messages || messages.length === 0) {
      return { success: true, data: [] }
    }

    const projectIds = [...new Set(messages.map(m => m.project_id))]
    const { data: readStates } = await supabase
      .from('portal_read_state')
      .select('project_id, last_read_at')
      .eq('user_type', 'owner')
      .in('project_id', projectIds)

    const readMap = new Map(
      (readStates || []).map(rs => [rs.project_id, rs.last_read_at])
    )

    const projectMap = new Map<string, {
      projectName: string
      unreadCount: number
      latestMessageAt: string
      latestMessageBody: string
    }>()

    for (const msg of messages) {
      const lastRead = readMap.get(msg.project_id)
      if (lastRead && new Date(msg.created_at) <= new Date(lastRead)) continue

      const existing = projectMap.get(msg.project_id)
      if (existing) {
        existing.unreadCount++
      } else {
        const project = msg.agency_projects as unknown as { name: string }
        projectMap.set(msg.project_id, {
          projectName: project.name,
          unreadCount: 1,
          latestMessageAt: msg.created_at,
          latestMessageBody: msg.body,
        })
      }
    }

    return {
      success: true,
      data: Array.from(projectMap.entries()).map(([projectId, d]) => ({
        projectId,
        ...d,
      })),
    }
  } catch (error) {
    console.error('Error getting unread messages with preview:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

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

    // Authenticate the employee first
    const { user } = await requireEmployee()
    console.log('[Admin] postOwnerMessage called by user:', user.id, 'projectId:', projectId)

    // Use service role client for insert (RLS enabled but no policies exist)
    const supabase = createPortalServiceClient()

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
      console.error('[Admin] Insert message error:', error)
      return { success: false, error: 'Failed to post message' }
    }

    console.log('[Admin] Message posted successfully:', message.id)

    if (process.env.PORTAL_MESSAGES_WEBHOOK_MODE !== 'webhook') {
      const broadcastResult = await broadcastPortalMessage(message as PortalMessage)
      if (!broadcastResult.ok) {
        console.warn('[Admin] Broadcast failed:', broadcastResult.error)
      } else {
        console.log('[Admin] Message broadcast successfully')
      }
    }

    return { success: true, message: message as PortalMessage }
  } catch (error) {
    console.error('Error posting owner message:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * React to a message with an emoji (e.g. ✅ acknowledgment)
 */
export async function reactToMessage(
  messageId: string,
  emoji: string = '✅'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireEmployee()
    const supabase = createPortalServiceClient()

    const { error } = await supabase
      .from('portal_message_reactions')
      .upsert(
        {
          message_id: messageId,
          user_id: user.id,
          user_type: 'owner',
          emoji,
        },
        { onConflict: 'message_id,user_id,emoji' }
      )

    if (error) {
      console.error('[Admin] React to message error:', error)
      return { success: false, error: 'Failed to react to message' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reacting to message:', error)
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
    // Authenticate the employee first
    const { user } = await requireEmployee()

    // Use service role client for upsert (RLS enabled but no policies exist)
    const supabase = createPortalServiceClient()

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
      console.error('[Admin] Update read state error:', error)
      return { success: false, error: 'Failed to update read state' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating owner read state:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
