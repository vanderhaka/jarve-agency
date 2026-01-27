// Data transformation layer for notifications

// Type for joined project data from Supabase
type ProjectJoinData = { name: string; owner_id?: string } | { name: string; owner_id?: string }[] | null

/**
 * Transform raw task data from database into notification-ready format
 */
export function transformTaskForNotification(task: {
  id: string
  title: string
  due_date: string
  status: string
  assigned_to: string | null
  project_id: string
  agency_projects: ProjectJoinData
}): {
  id: string
  title: string
  due_date: string
  status: string
  assigned_to: string | null
  project_id: string
  project_name: string
} {
  const projectData = Array.isArray(task.agency_projects)
    ? task.agency_projects[0]
    : task.agency_projects

  return {
    id: task.id,
    title: task.title,
    due_date: task.due_date,
    status: task.status,
    assigned_to: task.assigned_to,
    project_id: task.project_id,
    project_name: projectData?.name ?? 'Unknown Project',
  }
}

/**
 * Transform raw milestone data from database into notification-ready format
 */
export function transformMilestoneForNotification(milestone: {
  id: string
  title: string
  due_date: string
  status: string
  amount: number
  project_id: string
  agency_projects: ProjectJoinData
}): {
  id: string
  title: string
  due_date: string
  status: string
  amount: number
  project_id: string
  project_name: string
  project_owner_id: string
} {
  const projectData = Array.isArray(milestone.agency_projects)
    ? milestone.agency_projects[0]
    : milestone.agency_projects

  return {
    id: milestone.id,
    title: milestone.title,
    due_date: milestone.due_date,
    status: milestone.status,
    amount: Number(milestone.amount),
    project_id: milestone.project_id,
    project_name: projectData?.name ?? 'Unknown Project',
    project_owner_id: projectData?.owner_id ?? '',
  }
}

/**
 * Transform raw proposal data from database into notification-ready format
 */
export function transformProposalForNotification(proposal: {
  id: string
  title: string
  sent_at: string
  status: string
  project_id: string
  agency_projects: ProjectJoinData
}): {
  id: string
  title: string
  sent_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
} {
  const projectData = Array.isArray(proposal.agency_projects)
    ? proposal.agency_projects[0]
    : proposal.agency_projects

  return {
    id: proposal.id,
    title: proposal.title,
    sent_at: proposal.sent_at,
    status: proposal.status,
    project_id: proposal.project_id,
    project_name: projectData?.name ?? 'Unknown Project',
    project_owner_id: projectData?.owner_id ?? '',
  }
}

/**
 * Transform raw change request data from database into notification-ready format
 */
export function transformChangeRequestForNotification(cr: {
  id: string
  title: string
  created_at: string
  status: string
  project_id: string
  agency_projects: ProjectJoinData
}): {
  id: string
  title: string
  created_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
} {
  const projectData = Array.isArray(cr.agency_projects)
    ? cr.agency_projects[0]
    : cr.agency_projects

  return {
    id: cr.id,
    title: cr.title,
    created_at: cr.created_at,
    status: cr.status,
    project_id: cr.project_id,
    project_name: projectData?.name ?? 'Unknown Project',
    project_owner_id: projectData?.owner_id ?? '',
  }
}
