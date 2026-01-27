// Re-exports for backward compatibility
// This maintains the original API while splitting code into separate modules

export {
  getUnreadNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  insertNotification,
  insertNotifications,
  getReminderConfig,
  getOverdueTasks as getOverdueTasksRaw,
  getOverdueMilestones as getOverdueMilestonesRaw,
  getPendingProposals as getPendingProposalsRaw,
  getPendingChangeRequests as getPendingChangeRequestsRaw,
} from './queries'

export {
  transformTaskForNotification,
  transformMilestoneForNotification,
  transformProposalForNotification,
  transformChangeRequestForNotification,
} from './transforms'

// Wrapper functions that maintain original API behavior
import {
  getOverdueTasks as getOverdueTasksRaw,
  getOverdueMilestones as getOverdueMilestonesRaw,
  getPendingProposals as getPendingProposalsRaw,
  getPendingChangeRequests as getPendingChangeRequestsRaw,
} from './queries'

import {
  transformTaskForNotification,
  transformMilestoneForNotification,
  transformProposalForNotification,
  transformChangeRequestForNotification,
} from './transforms'

/**
 * Get overdue tasks with transformed data
 * @deprecated This function is kept for backward compatibility. Consider using getOverdueTasksRaw + transformTaskForNotification
 */
export async function getOverdueTasks(): Promise<Array<{
  id: string
  title: string
  due_date: string
  status: string
  assigned_to: string | null
  project_id: string
  project_name: string
}>> {
  const tasks = await getOverdueTasksRaw()
  return tasks.map(transformTaskForNotification)
}

/**
 * Get overdue milestones with transformed data
 * @deprecated This function is kept for backward compatibility. Consider using getOverdueMilestonesRaw + transformMilestoneForNotification
 */
export async function getOverdueMilestones(): Promise<Array<{
  id: string
  title: string
  due_date: string
  status: string
  amount: number
  project_id: string
  project_name: string
  project_owner_id: string
}>> {
  const milestones = await getOverdueMilestonesRaw()
  return milestones.map(transformMilestoneForNotification)
}

/**
 * Get pending proposals with transformed data
 * @deprecated This function is kept for backward compatibility. Consider using getPendingProposalsRaw + transformProposalForNotification
 */
export async function getPendingProposals(daysThreshold: number): Promise<Array<{
  id: string
  title: string
  sent_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
}>> {
  const proposals = await getPendingProposalsRaw(daysThreshold)
  return proposals.map(transformProposalForNotification)
}

/**
 * Get pending change requests with transformed data
 * @deprecated This function is kept for backward compatibility. Consider using getPendingChangeRequestsRaw + transformChangeRequestForNotification
 */
export async function getPendingChangeRequests(daysThreshold: number): Promise<Array<{
  id: string
  title: string
  created_at: string
  status: string
  project_id: string
  project_name: string
  project_owner_id: string
}>> {
  const changeRequests = await getPendingChangeRequestsRaw(daysThreshold)
  return changeRequests.map(transformChangeRequestForNotification)
}
