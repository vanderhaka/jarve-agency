import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import type { PortalMessage } from '@/lib/integrations/portal/types'
import { broadcastPortalMessage } from '@/lib/integrations/portal/realtime-server'

type StandardWebhookEvent = {
  type: string
  data: {
    message?: PortalMessage
  }
}

type SupabaseDbWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: PortalMessage
}

function getHeadersObject(headers: Headers) {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function parseSupabaseMessage(payload: SupabaseDbWebhookPayload): PortalMessage | null {
  if (payload.table !== 'portal_messages') return null
  if (!payload.record) return null
  return payload.record
}

function parseStandardWebhookMessage(event: StandardWebhookEvent): PortalMessage | null {
  if (event.type !== 'portal.message.created') return null
  return event.data.message ?? null
}

export async function POST(request: Request) {
  const payload = await request.text()
  const svixSecret = process.env.PORTAL_MESSAGES_WEBHOOK_SECRET
  const tokenSecret = process.env.PORTAL_MESSAGES_WEBHOOK_TOKEN

  let message: PortalMessage | null = null

  if (svixSecret) {
    try {
      const webhook = new Webhook(svixSecret)
      const event = webhook.verify(payload, getHeadersObject(request.headers)) as StandardWebhookEvent
      message = parseStandardWebhookMessage(event)
    } catch (error) {
      console.warn('[Portal] Webhook signature verification failed', error)
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }
  } else if (tokenSecret) {
    const token = request.headers.get('x-webhook-token')
    if (!token || token !== tokenSecret) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }
    try {
      const parsed = JSON.parse(payload) as SupabaseDbWebhookPayload
      message = parseSupabaseMessage(parsed)
    } catch (error) {
      console.warn('[Portal] Failed to parse webhook payload', error)
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
  } else {
    return NextResponse.json(
      { ok: false, error: 'Webhook verification not configured' },
      { status: 500 }
    )
  }

  if (!message) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const broadcastResult = await broadcastPortalMessage(message)
  if (!broadcastResult.ok) {
    console.warn('[Portal] Webhook broadcast failed:', broadcastResult.error)
    return NextResponse.json({ ok: false, error: 'Broadcast failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
