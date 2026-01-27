// Re-export all query functions
export {
  getMilestonesByProject,
  getMilestoneById,
  createMilestone,
  insertMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones,
  completeMilestone,
} from './queries'

// Re-export all calculation functions
export {
  getMilestoneStats,
} from './calculations'
