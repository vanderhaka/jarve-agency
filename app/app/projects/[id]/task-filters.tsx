'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useEffect, useCallback } from 'react'
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
import type { TaskFiltersState } from './filter-utils'

// Re-export utilities from filter-utils for backwards compatibility
export { parseFiltersFromParams, filterTasks } from './filter-utils'
export type { TaskFiltersState } from './filter-utils'

interface Props {
  filters: TaskFiltersState
}

export function TaskFilters({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const updateUrl = useCallback((key: keyof TaskFiltersState, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`)
  }, [router, searchParams])

  const handleSearchChange = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      updateUrl('search', value)
    }, 300)
  }, [updateUrl])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  function updateFilter(key: keyof TaskFiltersState, value: string) {
    updateUrl(key, value)
  }

  function clearFilters() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('status')
    params.delete('type')
    params.delete('priority')
    router.replace(`?${params.toString()}`)
  }

  const hasFilters = filters.search || filters.status || filters.type || filters.priority

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search tasks..."
          defaultValue={filters.search}
          onChange={e => handleSearchChange(e.target.value)}
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
