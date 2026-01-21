// Shared filter utilities (can be used in both server and client components)

export interface TaskFiltersState {
  search: string
  status: string
  type: string
  priority: string
}

export function parseFiltersFromParams(searchParams: URLSearchParams): TaskFiltersState {
  return {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    type: searchParams.get('type') || '',
    priority: searchParams.get('priority') || '',
  }
}

export function filterTasks<T extends {
  title: string
  description: string | null
  status: string
  type: string
  priority: string
}>(tasks: T[], filters: TaskFiltersState): T[] {
  return tasks.filter(task => {
    // Search filter (title or description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(searchLower)
      const matchesDescription = task.description?.toLowerCase().includes(searchLower) || false
      if (!matchesTitle && !matchesDescription) return false
    }

    // Status filter
    if (filters.status && task.status !== filters.status) return false

    // Type filter
    if (filters.type && task.type !== filters.type) return false

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) return false

    return true
  })
}
