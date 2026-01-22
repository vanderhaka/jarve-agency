'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function bulkChangeRole(
  employeeIds: string[],
  newRole: 'admin' | 'employee'
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if current user is admin
  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (currentEmployee?.role !== 'admin') {
    redirect('/app')
  }

  // Validate inputs
  if (!employeeIds || employeeIds.length === 0) {
    return { success: false, message: 'No employees selected' }
  }

  if (!['admin', 'employee'].includes(newRole)) {
    return { success: false, message: 'Invalid role' }
  }

  // Prevent admin from demoting themselves
  if (employeeIds.includes(user.id) && newRole !== 'admin') {
    return {
      success: false,
      message: 'You cannot change your own role',
    }
  }

  // Update all selected employees
  const { error } = await supabase
    .from('employees')
    .update({ role: newRole })
    .in('id', employeeIds)
    .is('deleted_at', null)

  if (error) {
    console.error('[bulkChangeRole] Update error:', error)
    return {
      success: false,
      message: 'Failed to update roles. Please try again.',
    }
  }

  revalidatePath('/admin/employees')

  return {
    success: true,
    message: `Successfully updated ${employeeIds.length} ${employeeIds.length === 1 ? 'employee' : 'employees'}`,
  }
}
