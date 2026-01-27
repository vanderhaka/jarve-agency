import type { MilestoneStatus } from '@/lib/milestones/types'

export const statusColors: Record<MilestoneStatus, string> = {
  planned: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
}

export const statusLabels: Record<MilestoneStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  complete: 'Complete',
  invoiced: 'Invoiced',
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount)
}

export function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
