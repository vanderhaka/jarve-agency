import { useState, useEffect } from 'react'
import { getAgencySettings, updateAgencySettings } from '@/app/admin/settings/actions'
import type { AgencySettings } from '@/app/admin/settings/constants'

const LOAD_ERROR_MESSAGE = 'Failed to load agency settings'

export function useAgencySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<AgencySettings | null>(null)

  useEffect(() => {
    async function fetchSettings() {
      const result = await getAgencySettings()
      if (result.error) {
        setError(result.error)
      } else {
        setSettings(result.data)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    const result = await updateAgencySettings({
      legal_name: settings.legal_name,
      trade_name: settings.trade_name,
      abn: settings.abn,
      default_currency: settings.default_currency,
      timezone: settings.timezone,
      invoice_prefix: settings.invoice_prefix,
      invoice_terms: settings.invoice_terms,
      invoice_terms_days: settings.invoice_terms_days,
      default_deposit_percent: settings.default_deposit_percent,
      timesheet_lock_weekday: settings.timesheet_lock_weekday,
      timesheet_lock_time: settings.timesheet_lock_time,
      reminder_frequency: settings.reminder_frequency,
      reminder_time: settings.reminder_time,
    })

    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return {
    loading,
    saving,
    error,
    success,
    settings,
    setSettings,
    handleSubmit,
    LOAD_ERROR_MESSAGE,
  }
}
