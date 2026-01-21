'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { TASK_STATUSES, TASK_TYPES, TASK_PRIORITIES } from '@/lib/tasks/types'

export interface TaskFiltersState {
  search: string
  status: string
  type: string
  priority: string
}

interface Props {
  filters: TaskFiltersState
}

export function TaskFilters({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: keyof TaskFiltersState, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('status')
    params.delete('type')
    params.delete('priority')
    router.push(`?${params.toString()}`)
  }

  const hasFilters = filters.search || filters.status || filters.type || filters.priority

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => updateFilter('search', e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filters.status || 'all'} onValueChange={v => updateFilter('status', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {TASK_STATUSES.map(status => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type || 'all'} onValueChange={v => updateFilter('type', v)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {TASK_TYPES.map(type => (
            <SelectItem key={type} value={type}>{type}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority || 'all'} onValueChange={v => updateFilter('priority', v)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {TASK_PRIORITIES.map(priority => (
            <SelectItem key={priority} value={priority}>{priority}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
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
