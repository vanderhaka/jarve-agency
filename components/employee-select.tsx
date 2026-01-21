'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'

const UNASSIGNED_VALUE = 'unassigned'

interface Employee {
  id: string
  name: string
  email: string
}

interface EmployeeSelectProps {
  value?: string
  onChange?: (value: string) => void
  name?: string
  required?: boolean
  autoSelectSingle?: boolean
}

export function EmployeeSelect({ value, onChange, name, required, autoSelectSingle = false }: EmployeeSelectProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [internalValue, setInternalValue] = useState(value)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEmployees() {
      const { data } = await supabase
        .from('employees')
        .select('id, name, email')
        .is('deleted_at', null)
        .order('name')

      if (data) {
        setEmployees(data)
        if (autoSelectSingle && data.length === 1 && !value) {
          const singleEmployeeId = data[0].id
          setInternalValue(singleEmployeeId)
          onChange?.(singleEmployeeId)
        }
      }
      setLoading(false)
    }
    fetchEmployees()
  }, [autoSelectSingle, onChange, supabase, value])

  const selectValue = value ?? internalValue ?? UNASSIGNED_VALUE

  function handleChange(newValue: string) {
    const actualValue = newValue === UNASSIGNED_VALUE ? '' : newValue
    setInternalValue(actualValue)
    onChange?.(actualValue)
  }

  return (
    <Select name={name} value={selectValue} onValueChange={handleChange} required={required}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading..." : "Assign to..."} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}



