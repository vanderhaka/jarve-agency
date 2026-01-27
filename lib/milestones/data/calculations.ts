import { createClient } from '@/utils/supabase/server'

/**
 * Get milestone stats for a project
 */
export async function getMilestoneStats(projectId: string): Promise<{
  total: number
  planned: number
  active: number
  complete: number
  invoiced: number
  totalAmount: number
  invoicedAmount: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('milestones')
    .select('status, amount')
    .eq('project_id', projectId)

  if (error) {
    console.error('[getMilestoneStats] Error:', error)
    throw new Error('Failed to get milestone stats')
  }

  const stats = {
    total: data.length,
    planned: 0,
    active: 0,
    complete: 0,
    invoiced: 0,
    totalAmount: 0,
    invoicedAmount: 0,
  }

  for (const m of data) {
    stats.totalAmount += Number(m.amount)
    if (m.status === 'planned') stats.planned++
    if (m.status === 'active') stats.active++
    if (m.status === 'complete') stats.complete++
    if (m.status === 'invoiced') {
      stats.invoiced++
      stats.invoicedAmount += Number(m.amount)
    }
  }

  return stats
}
