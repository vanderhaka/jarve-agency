import { createClient } from '@/utils/supabase/server'

export type AlertType = 'ranking_drop' | 'ranking_lost' | 'publish_failed' | 'quality_gate_spike' | 'broken_link'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved'

export interface SeoAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string | null
  metadata: Record<string, unknown>
  status: AlertStatus
  created_at: string
  resolved_at: string | null
}

export async function createAlert(
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message?: string,
  metadata?: Record<string, unknown>
): Promise<SeoAlert | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seo_alerts')
    .insert({
      type,
      severity,
      title,
      message: message || null,
      metadata: metadata || {},
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create alert:', error)
    return null
  }

  return data
}

export async function acknowledgeAlert(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seo_alerts')
    .update({ status: 'acknowledged' })
    .eq('id', id)

  if (error) {
    console.error('Failed to acknowledge alert:', error)
    return false
  }

  return true
}

export async function resolveAlert(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seo_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to resolve alert:', error)
    return false
  }

  return true
}

export async function getActiveAlerts(): Promise<SeoAlert[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seo_alerts')
    .select('*')
    .in('status', ['active', 'acknowledged'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch alerts:', error)
    return []
  }

  return data || []
}
