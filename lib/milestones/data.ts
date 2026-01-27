// Backward compatibility layer - re-exports from data/ directory
// All imports from '@/lib/milestones/data' will continue to work

export {
  getMilestonesByProject,
  getMilestoneById,
  createMilestone,
  insertMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones,
  completeMilestone,
} from './data/queries'

export {
  getMilestoneStats,
} from './data/calculations'
