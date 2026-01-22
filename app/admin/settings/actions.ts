'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AgencySettings {
  id: string
  legal_name: string | null
  trade_name: string | null
  abn: string | null
  gst_rate: number
  default_currency: string
  timezone: string
  invoice_prefix: string
  invoice_terms: string | null
  invoice_terms_days: number | null
  default_deposit_percent: number
  timesheet_lock_weekday: number | null
  timesheet_lock_time: string | null
  reminder_frequency: string
  reminder_time: string | null
  created_at: string
  updated_at: string
}

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

export interface UpdateAgencySettingsInput {
  legal_name?: string | null
  trade_name?: string | null
  abn?: string | null
  default_currency?: string
  timezone?: string
  invoice_prefix?: string
  invoice_terms?: string | null
  invoice_terms_days?: number | null
  default_deposit_percent?: number
  timesheet_lock_weekday?: number | null
  timesheet_lock_time?: string | null
  reminder_frequency?: string
  reminder_time?: string | null
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

// Common currencies (ISO 4217)
export const CURRENCIES = [
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
] as const

// Australian timezones (IANA)
export const TIMEZONES = [
  { zone: 'Australia/Adelaide', name: 'Adelaide (ACST/ACDT)' },
  { zone: 'Australia/Brisbane', name: 'Brisbane (AEST)' },
  { zone: 'Australia/Darwin', name: 'Darwin (ACST)' },
  { zone: 'Australia/Hobart', name: 'Hobart (AEST/AEDT)' },
  { zone: 'Australia/Melbourne', name: 'Melbourne (AEST/AEDT)' },
  { zone: 'Australia/Perth', name: 'Perth (AWST)' },
  { zone: 'Australia/Sydney', name: 'Sydney (AEST/AEDT)' },
  { zone: 'Pacific/Auckland', name: 'Auckland (NZST/NZDT)' },
  { zone: 'Asia/Singapore', name: 'Singapore (SGT)' },
  { zone: 'America/New_York', name: 'New York (EST/EDT)' },
  { zone: 'America/Los_Angeles', name: 'Los Angeles (PST/PDT)' },
  { zone: 'Europe/London', name: 'London (GMT/BST)' },
] as const

// Days of week for timesheet lock
export const WEEKDAYS = [
  { value: 0, name: 'Sunday' },
  { value: 1, name: 'Monday' },
  { value: 2, name: 'Tuesday' },
  { value: 3, name: 'Wednesday' },
  { value: 4, name: 'Thursday' },
  { value: 5, name: 'Friday' },
  { value: 6, name: 'Saturday' },
] as const

// Reminder frequencies
export const REMINDER_FREQUENCIES = [
  { value: 'daily', name: 'Daily' },
  { value: 'weekly', name: 'Weekly' },
  { value: 'off', name: 'Off' },
] as const
