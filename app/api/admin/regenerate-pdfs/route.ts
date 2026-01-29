import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { regenerateAllPendingPdfs } from '@/app/actions/contract-docs/regenerate-pdf'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await regenerateAllPendingPdfs()
  return NextResponse.json(result)
}
