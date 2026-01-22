'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/terra-flow/ui/select'
import { X } from 'lucide-react'

const INTERACTION_TYPES = ['call', 'email', 'meeting', 'note'] as const

interface AuditFiltersProps {
  employees: Array<{ id: string; name: string | null }>
}

export function AuditFilters({ employees }: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentType = searchParams.get('type') || 'all'
  const currentEmployee = searchParams.get('employee') || 'all'
  const currentFrom = searchParams.get('from') || ''
  const currentTo = searchParams.get('to') || ''

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    params.delete('page')
    router.replace(`?${params.toString()}`)
  }

  function clearFilters() {
    const params = new URLSearchParams()
    router.replace(`?${params.toString()}`)
  }

  const hasFilters = currentType !== 'all' || currentEmployee !== 'all' || currentFrom || currentTo

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <Select value={currentType} onValueChange={(v) => updateFilter('type', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {INTERACTION_TYPES.map((type) => (
            <SelectItem key={type} value={type} className="capitalize">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentEmployee} onValueChange={(v) => updateFilter('employee', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Employee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {emp.name || 'Unnamed'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          placeholder="From"
          value={currentFrom}
          onChange={(e) => updateFilter('from', e.target.value)}
          className="w-[150px]"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          placeholder="To"
          value={currentTo}
          onChange={(e) => updateFilter('to', e.target.value)}
          className="w-[150px]"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
