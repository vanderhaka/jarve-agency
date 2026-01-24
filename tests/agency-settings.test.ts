import { describe, expect, it, vi } from 'vitest'
import {
  stripGstRate,
  validateSettingsInput,
  performGetAgencySettings,
  performUpdateAgencySettings,
  DEFAULT_SETTINGS,
  FIXED_GST_RATE,
  type AgencySettings,
  type AgencySettingsClient,
  type UpdateAgencySettingsInput,
} from '@/lib/settings/agency'

// Helper to create mock settings
function createMockSettings(overrides: Partial<AgencySettings> = {}): AgencySettings {
  return {
    id: 'settings-1',
    legal_name: 'Test Agency Pty Ltd',
    trade_name: 'Test Agency',
    abn: '12345678901',
    gst_rate: 10,
    default_currency: 'AUD',
    timezone: 'Australia/Sydney',
    invoice_prefix: 'INV',
    invoice_terms: 'Payment due on receipt',
    invoice_terms_days: 14,
    default_deposit_percent: 50,
    timesheet_lock_weekday: 1,
    timesheet_lock_time: '09:00',
    reminder_frequency: 'daily',
    reminder_time: '09:00',
    created_at: '2026-01-23T00:00:00Z',
    updated_at: '2026-01-23T00:00:00Z',
    ...overrides,
  }
}

// Helper to create a mock client with customizable behavior
function createMockClient(overrides: Partial<AgencySettingsClient> = {}): AgencySettingsClient {
  return {
    getSettings: vi.fn(async () => ({ data: createMockSettings(), error: null })),
    createDefaultSettings: vi.fn(async () => ({ data: createMockSettings(), error: null })),
    updateSettings: vi.fn(async () => ({ error: null })),
    ...overrides,
  }
}

describe('DEFAULT_SETTINGS', () => {
  it('has GST rate fixed at 10%', () => {
    expect(DEFAULT_SETTINGS.gst_rate).toBe(10)
  })

  it('has default currency as AUD', () => {
    expect(DEFAULT_SETTINGS.default_currency).toBe('AUD')
  })

  it('has default deposit percent as 50', () => {
    expect(DEFAULT_SETTINGS.default_deposit_percent).toBe(50)
  })

  it('has default reminder frequency as daily', () => {
    expect(DEFAULT_SETTINGS.reminder_frequency).toBe('daily')
  })
})

describe('FIXED_GST_RATE', () => {
  it('is 10', () => {
    expect(FIXED_GST_RATE).toBe(10)
  })
})

describe('stripGstRate', () => {
  it('removes gst_rate from input', () => {
    const input = {
      gst_rate: 15,
      default_currency: 'USD',
      timezone: 'America/New_York',
    }

    const result = stripGstRate(input)

    expect(result).not.toHaveProperty('gst_rate')
    expect(result).toEqual({
      default_currency: 'USD',
      timezone: 'America/New_York',
    })
  })

  it('handles input without gst_rate', () => {
    const input = {
      default_currency: 'EUR',
    }

    const result = stripGstRate(input)

    expect(result).toEqual({
      default_currency: 'EUR',
    })
  })

  it('preserves all other properties', () => {
    const input = {
      gst_rate: 20,
      legal_name: 'Test Company',
      trade_name: 'Test',
      abn: '12345678901',
      default_currency: 'AUD',
      timezone: 'Australia/Sydney',
      invoice_prefix: 'INV',
      default_deposit_percent: 30,
    }

    const result = stripGstRate(input)

    expect(result).toEqual({
      legal_name: 'Test Company',
      trade_name: 'Test',
      abn: '12345678901',
      default_currency: 'AUD',
      timezone: 'Australia/Sydney',
      invoice_prefix: 'INV',
      default_deposit_percent: 30,
    })
  })
})

describe('validateSettingsInput', () => {
  it('accepts valid input', () => {
    const input: UpdateAgencySettingsInput = {
      default_currency: 'AUD',
      default_deposit_percent: 50,
      timesheet_lock_weekday: 1,
      reminder_frequency: 'daily',
    }

    const result = validateSettingsInput(input)

    expect(result).toEqual({ valid: true })
  })

  it('accepts empty input', () => {
    const result = validateSettingsInput({})
    expect(result).toEqual({ valid: true })
  })

  describe('currency validation', () => {
    it('rejects invalid currency format (lowercase)', () => {
      const result = validateSettingsInput({ default_currency: 'aud' })
      expect(result).toEqual({ valid: false, message: 'Currency must be a valid 3-letter ISO code' })
    })

    it('rejects invalid currency format (wrong length)', () => {
      const result = validateSettingsInput({ default_currency: 'AU' })
      expect(result).toEqual({ valid: false, message: 'Currency must be a valid 3-letter ISO code' })
    })

    it('rejects invalid currency format (too long)', () => {
      const result = validateSettingsInput({ default_currency: 'AUSD' })
      expect(result).toEqual({ valid: false, message: 'Currency must be a valid 3-letter ISO code' })
    })

    it('accepts valid currency codes', () => {
      expect(validateSettingsInput({ default_currency: 'USD' })).toEqual({ valid: true })
      expect(validateSettingsInput({ default_currency: 'EUR' })).toEqual({ valid: true })
      expect(validateSettingsInput({ default_currency: 'GBP' })).toEqual({ valid: true })
    })
  })

  describe('deposit percent validation', () => {
    it('rejects negative deposit percent', () => {
      const result = validateSettingsInput({ default_deposit_percent: -1 })
      expect(result).toEqual({ valid: false, message: 'Deposit percent must be between 0 and 100' })
    })

    it('rejects deposit percent over 100', () => {
      const result = validateSettingsInput({ default_deposit_percent: 101 })
      expect(result).toEqual({ valid: false, message: 'Deposit percent must be between 0 and 100' })
    })

    it('accepts 0% deposit', () => {
      const result = validateSettingsInput({ default_deposit_percent: 0 })
      expect(result).toEqual({ valid: true })
    })

    it('accepts 100% deposit', () => {
      const result = validateSettingsInput({ default_deposit_percent: 100 })
      expect(result).toEqual({ valid: true })
    })
  })

  describe('timesheet lock weekday validation', () => {
    it('rejects negative weekday', () => {
      const result = validateSettingsInput({ timesheet_lock_weekday: -1 })
      expect(result).toEqual({ valid: false, message: 'Timesheet lock weekday must be 0-6 (Sunday-Saturday)' })
    })

    it('rejects weekday over 6', () => {
      const result = validateSettingsInput({ timesheet_lock_weekday: 7 })
      expect(result).toEqual({ valid: false, message: 'Timesheet lock weekday must be 0-6 (Sunday-Saturday)' })
    })

    it('accepts valid weekdays 0-6', () => {
      for (let i = 0; i <= 6; i++) {
        const result = validateSettingsInput({ timesheet_lock_weekday: i })
        expect(result).toEqual({ valid: true })
      }
    })

    it('accepts null weekday', () => {
      const result = validateSettingsInput({ timesheet_lock_weekday: null })
      expect(result).toEqual({ valid: true })
    })
  })

  describe('reminder frequency validation', () => {
    it('rejects invalid frequency', () => {
      const result = validateSettingsInput({ reminder_frequency: 'monthly' })
      expect(result).toEqual({ valid: false, message: 'Reminder frequency must be daily, weekly, or off' })
    })

    it('accepts valid frequencies', () => {
      expect(validateSettingsInput({ reminder_frequency: 'daily' })).toEqual({ valid: true })
      expect(validateSettingsInput({ reminder_frequency: 'weekly' })).toEqual({ valid: true })
      expect(validateSettingsInput({ reminder_frequency: 'off' })).toEqual({ valid: true })
    })
  })

  describe('invoice terms days validation', () => {
    it('rejects negative days', () => {
      const result = validateSettingsInput({ invoice_terms_days: -1 })
      expect(result).toEqual({ valid: false, message: 'Invoice terms days must be a positive number' })
    })

    it('accepts 0 days', () => {
      const result = validateSettingsInput({ invoice_terms_days: 0 })
      expect(result).toEqual({ valid: true })
    })

    it('accepts null days', () => {
      const result = validateSettingsInput({ invoice_terms_days: null })
      expect(result).toEqual({ valid: true })
    })
  })
})

describe('performGetAgencySettings', () => {
  it('returns existing settings', async () => {
    const mockSettings = createMockSettings()
    const client = createMockClient({
      getSettings: vi.fn(async () => ({ data: mockSettings, error: null })),
    })

    const result = await performGetAgencySettings(client)

    expect(result.data).toEqual(mockSettings)
    expect(result.error).toBeNull()
    expect(client.createDefaultSettings).not.toHaveBeenCalled()
  })

  it('creates default settings when none exist', async () => {
    const mockSettings = createMockSettings()
    const client = createMockClient({
      getSettings: vi.fn(async () => ({ data: null, error: { code: 'PGRST116', message: 'no rows' } })),
      createDefaultSettings: vi.fn(async () => ({ data: mockSettings, error: null })),
    })

    const result = await performGetAgencySettings(client)

    expect(result.data).toEqual(mockSettings)
    expect(result.error).toBeNull()
    expect(client.createDefaultSettings).toHaveBeenCalled()
  })

  it('returns error on database failure (non PGRST116)', async () => {
    const client = createMockClient({
      getSettings: vi.fn(async () => ({ data: null, error: { code: '42P01', message: 'DB error' } })),
    })

    const result = await performGetAgencySettings(client)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Failed to fetch settings')
  })

  it('returns error when default creation fails', async () => {
    const client = createMockClient({
      getSettings: vi.fn(async () => ({ data: null, error: { code: 'PGRST116', message: 'no rows' } })),
      createDefaultSettings: vi.fn(async () => ({ data: null, error: { message: 'Insert failed' } })),
    })

    const result = await performGetAgencySettings(client)

    expect(result.data).toBeNull()
    expect(result.error).toBe('Failed to initialize settings')
  })
})

describe('performUpdateAgencySettings', () => {
  it('updates settings successfully', async () => {
    const client = createMockClient()
    const input: UpdateAgencySettingsInput = {
      legal_name: 'New Name',
      default_currency: 'USD',
    }

    const result = await performUpdateAgencySettings(client, input)

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
    expect(client.updateSettings).toHaveBeenCalled()
  })

  it('strips GST rate from update', async () => {
    const client = createMockClient()
    const input: UpdateAgencySettingsInput = {
      gst_rate: 15, // Should be stripped
      default_currency: 'USD',
    }

    await performUpdateAgencySettings(client, input)

    expect(client.updateSettings).toHaveBeenCalledWith({
      default_currency: 'USD',
    })
  })

  it('returns error on validation failure', async () => {
    const client = createMockClient()
    const input: UpdateAgencySettingsInput = {
      default_currency: 'invalid', // Invalid format
    }

    const result = await performUpdateAgencySettings(client, input)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Currency must be a valid 3-letter ISO code')
    expect(client.updateSettings).not.toHaveBeenCalled()
  })

  it('returns error on database failure', async () => {
    const client = createMockClient({
      updateSettings: vi.fn(async () => ({ error: { message: 'DB error' } })),
    })

    const result = await performUpdateAgencySettings(client, { legal_name: 'Test' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to save settings')
  })

  it('allows updating all valid fields', async () => {
    const client = createMockClient()
    const input: UpdateAgencySettingsInput = {
      legal_name: 'Legal Name Pty Ltd',
      trade_name: 'Trade Name',
      abn: '98765432109',
      default_currency: 'USD',
      timezone: 'America/New_York',
      invoice_prefix: 'BILL',
      invoice_terms: 'Net 30',
      invoice_terms_days: 30,
      default_deposit_percent: 25,
      timesheet_lock_weekday: 5,
      timesheet_lock_time: '17:00',
      reminder_frequency: 'weekly',
      reminder_time: '08:00',
    }

    const result = await performUpdateAgencySettings(client, input)

    expect(result.success).toBe(true)
    expect(client.updateSettings).toHaveBeenCalledWith(input)
  })
})
