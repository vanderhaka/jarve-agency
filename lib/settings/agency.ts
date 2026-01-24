/**
 * Agency settings business logic - extracted for testability
 */

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

export interface UpdateAgencySettingsInput {
  legal_name?: string | null
  trade_name?: string | null
  abn?: string | null
  gst_rate?: number // Note: This will be stripped out - GST is fixed at 10%
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

// Default settings values
export const DEFAULT_SETTINGS: Omit<AgencySettings, 'id' | 'created_at' | 'updated_at'> = {
  legal_name: null,
  trade_name: null,
  abn: null,
  gst_rate: 10, // Fixed at 10%
  default_currency: 'AUD',
  timezone: 'Australia/Sydney',
  invoice_prefix: 'INV',
  invoice_terms: null,
  invoice_terms_days: null,
  default_deposit_percent: 50,
  timesheet_lock_weekday: null,
  timesheet_lock_time: null,
  reminder_frequency: 'daily',
  reminder_time: null,
}

// Fixed GST rate - cannot be changed
export const FIXED_GST_RATE = 10

// Client interface for dependency injection
export interface AgencySettingsClient {
  getSettings: () => Promise<{ data: AgencySettings | null; error: { code?: string; message: string } | null }>
  createDefaultSettings: () => Promise<{ data: AgencySettings | null; error: { message: string } | null }>
  updateSettings: (data: Partial<AgencySettings>) => Promise<{ error: { message: string } | null }>
}

/**
 * Strips GST rate from update input - GST cannot be changed
 */
export function stripGstRate<T extends { gst_rate?: number }>(input: T): Omit<T, 'gst_rate'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gst_rate, ...rest } = input
  return rest
}

/**
 * Validates agency settings input
 */
export function validateSettingsInput(input: UpdateAgencySettingsInput): { valid: true } | { valid: false; message: string } {
  // Validate currency code format (3 uppercase letters)
  if (input.default_currency !== undefined) {
    if (!/^[A-Z]{3}$/.test(input.default_currency)) {
      return { valid: false, message: 'Currency must be a valid 3-letter ISO code' }
    }
  }

  // Validate deposit percent (0-100)
  if (input.default_deposit_percent !== undefined) {
    if (input.default_deposit_percent < 0 || input.default_deposit_percent > 100) {
      return { valid: false, message: 'Deposit percent must be between 0 and 100' }
    }
  }

  // Validate timesheet lock weekday (0-6)
  if (input.timesheet_lock_weekday !== undefined && input.timesheet_lock_weekday !== null) {
    if (input.timesheet_lock_weekday < 0 || input.timesheet_lock_weekday > 6) {
      return { valid: false, message: 'Timesheet lock weekday must be 0-6 (Sunday-Saturday)' }
    }
  }

  // Validate reminder frequency
  if (input.reminder_frequency !== undefined) {
    if (!['daily', 'weekly', 'off'].includes(input.reminder_frequency)) {
      return { valid: false, message: 'Reminder frequency must be daily, weekly, or off' }
    }
  }

  // Validate invoice terms days (positive number if set)
  if (input.invoice_terms_days !== undefined && input.invoice_terms_days !== null) {
    if (input.invoice_terms_days < 0) {
      return { valid: false, message: 'Invoice terms days must be a positive number' }
    }
  }

  return { valid: true }
}

/**
 * Gets agency settings, creating default row if none exists
 */
export async function performGetAgencySettings(
  client: AgencySettingsClient
): Promise<{ data: AgencySettings | null; error: string | null }> {
  // Try to get existing settings
  const { data, error } = await client.getSettings()

  if (error && error.code !== 'PGRST116') {
    // Error other than "no rows"
    return { data: null, error: 'Failed to fetch settings' }
  }

  if (data) {
    return { data, error: null }
  }

  // No settings exist, create default row
  const { data: newSettings, error: insertError } = await client.createDefaultSettings()

  if (insertError) {
    return { data: null, error: 'Failed to initialize settings' }
  }

  return { data: newSettings, error: null }
}

/**
 * Updates agency settings (GST rate cannot be changed)
 */
export async function performUpdateAgencySettings(
  client: AgencySettingsClient,
  input: UpdateAgencySettingsInput
): Promise<{ success: boolean; error: string | null }> {
  // Validate input
  const validation = validateSettingsInput(input)
  if (!validation.valid) {
    return { success: false, error: validation.message }
  }

  // Strip GST rate - it cannot be changed
  const updateData = stripGstRate(input)

  // Update settings
  const { error } = await client.updateSettings(updateData)

  if (error) {
    return { success: false, error: 'Failed to save settings' }
  }

  return { success: true, error: null }
}
