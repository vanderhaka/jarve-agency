/**
 * Task data operations
 * @deprecated This file re-exports from lib/tasks/data/* for backward compatibility.
 * New code should import from lib/tasks/data/queries or lib/tasks/data/grouping directly.
 */

export {
  getTasksByProject,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTaskCounts,
  getOverdueCount,
  getTasksByProjectGrouped,
} from './data/index'
