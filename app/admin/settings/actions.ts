'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AgencySettings, UpdateAgencySettingsInput } from './constants'

/**
 * Get agency settings (creates default row if none exists)
 */
export async function getAgencySettings(): Promise<{ data: AgencySettings | null; error: string | null }> {
  const supabase = await createClient()

  // Try to get existing settings
  const { data, error } = await supabase
    .from('agency_settings')
    .select('*')
    .single()

  if (error && error.code !== 'PGRST116') {
    // Error other than "no rows"
    console.error('Failed to fetch agency settings:', error)
    return { data: null, error: 'Failed to fetch settings' }
  }

  if (data) {
    return { data: data as AgencySettings, error: null }
  }

  // No settings exist, create default row
  const { data: newSettings, error: insertError } = await supabase
    .from('agency_settings')
    .insert({ singleton: true })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to create agency settings:', insertError)
    return { data: null, error: 'Failed to initialize settings' }
  }

  return { data: newSettings as AgencySettings, error: null }
}

/**
 * Update agency settings
 */
export async function updateAgencySettings(
  input: UpdateAgencySettingsInput
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // GST rate cannot be changed (fixed at 10%)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...input }
  delete updateData.gst_rate

  const { error } = await supabase
    .from('agency_settings')
    .update(updateData)
    .eq('singleton', true)

  if (error) {
    console.error('Failed to update agency settings:', error)
    return { success: false, error: 'Failed to save settings' }
  }

  revalidatePath('/admin/settings')
  return { success: true, error: null }
}
