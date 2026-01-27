import { createClient } from '@/utils/supabase/server'

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
