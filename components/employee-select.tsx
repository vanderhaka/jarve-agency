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
}

export function EmployeeSelect({ value, onChange, name, required }: EmployeeSelectProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchEmployees() {
      const { data } = await supabase
        .from('employees')
        .select('id, name, email')
        .order('name')
      
      if (data) setEmployees(data)
      setLoading(false)
    }
    fetchEmployees()
  }, [])

  return (
    <Select name={name} value={value} onValueChange={onChange} required={required}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Assign to..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {employees.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}



