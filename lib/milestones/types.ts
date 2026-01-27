export type MilestoneStatus = 'planned' | 'active' | 'complete' | 'invoiced'

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  amount: number
  gst_rate: number
  due_date: string | null
  status: MilestoneStatus
  sort_order: number
  is_deposit: boolean
  invoice_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateMilestoneInput {
  project_id: string
  title: string
  description?: string | null
  amount: number
  gst_rate?: number
  due_date?: string | null
  status?: MilestoneStatus
  is_deposit?: boolean
}

export interface UpdateMilestoneInput {
  title?: string
  description?: string | null
  amount?: number
  gst_rate?: number
  due_date?: string | null
  status?: MilestoneStatus
  is_deposit?: boolean
}

export interface InsertMilestoneInput extends CreateMilestoneInput {
  position: number // Index to insert at (0 = first)
}
