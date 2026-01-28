import type { PortalMessage } from './types'
import { getPortalChatChannel, PORTAL_CHAT_EVENT, PORTAL_DASHBOARD_CHANNEL, PORTAL_DASHBOARD_EVENT } from './realtime'

type BroadcastResult = { ok: true } | { ok: false; error: string }

export async function broadcastPortalMessage(message: PortalMessage): Promise<BroadcastResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }
  }

  if (!serviceRoleKey) {
    return { ok: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }
  }

  const endpoint = new URL('/realtime/v1/api/broadcast', supabaseUrl).toString()
  const messages = [
    {
      topic: getPortalChatChannel(message.project_id),
      event: PORTAL_CHAT_EVENT,
      payload: { message },
    },
  ]

  if (message.author_type === 'client') {
    messages.push({
      topic: PORTAL_DASHBOARD_CHANNEL,
      event: PORTAL_DASHBOARD_EVENT,
      payload: { message },
    })
  }

  const payload = { messages }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    return { ok: false, error: `Realtime broadcast failed (${response.status}): ${body}` }
  }

  return { ok: true }
}
