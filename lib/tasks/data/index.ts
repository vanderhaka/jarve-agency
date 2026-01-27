/**
 * Task data operations
 * Re-exports all functions for backward compatibility
 */

// Query functions
export {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTaskCounts,
  getOverdueCount,
} from './queries'

// Grouping functions
export { getTasksByProjectGrouped } from './grouping'
