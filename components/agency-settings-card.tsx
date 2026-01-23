'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Building2 } from 'lucide-react'
import { getAgencySettings, updateAgencySettings } from '@/app/admin/settings/actions'
import {
  type AgencySettings,
  CURRENCIES,
  TIMEZONES,
  WEEKDAYS,
  REMINDER_FREQUENCIES,
} from '@/app/admin/settings/constants'

const LOAD_ERROR_MESSAGE = 'Failed to load agency settings'

export function AgencySettingsCard() {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    const displayError = error ? error : LOAD_ERROR_MESSAGE
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">{displayError}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle>Agency Settings</CardTitle>
            <CardDescription>Configure your business defaults</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Business Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={settings.legal_name ?? ''}
                  onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                  placeholder="Legal business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade_name">Trade Name</Label>
                <Input
                  id="trade_name"
                  value={settings.trade_name ?? ''}
                  onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
                  placeholder="Trading as..."
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="abn">ABN</Label>
                <Input
                  id="abn"
                  value={settings.abn ?? ''}
                  onChange={(e) => setSettings({ ...settings, abn: e.target.value })}
                  placeholder="XX XXX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_rate">GST Rate</Label>
                <Input
                  id="gst_rate"
                  value={`${(settings.gst_rate * 100).toFixed(0)}%`}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Fixed at 10% for Australian GST</p>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Regional Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default_currency">Default Currency</Label>
                <Select
                  value={settings.default_currency}
                  onValueChange={(value) => setSettings({ ...settings, default_currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.zone} value={tz.zone}>
                        {tz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Invoice Settings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                <Input
                  id="invoice_prefix"
                  value={settings.invoice_prefix}
                  onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                  placeholder="INV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_deposit_percent">Default Deposit %</Label>
                <Input
                  id="default_deposit_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={(settings.default_deposit_percent * 100).toFixed(0)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      default_deposit_percent: parseInt(e.target.value) / 100,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice_terms">Invoice Terms</Label>
                <Input
                  id="invoice_terms"
                  value={settings.invoice_terms ?? ''}
                  onChange={(e) => setSettings({ ...settings, invoice_terms: e.target.value })}
                  placeholder="e.g., Net 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_terms_days">Payment Due (days)</Label>
                <Input
                  id="invoice_terms_days"
                  type="number"
                  min="0"
                  value={settings.invoice_terms_days ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoice_terms_days: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Timesheet Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Timesheet Lock Schedule</h3>
            <p className="text-xs text-muted-foreground">
              Configure when timesheets are locked for the previous week (used in Stage 7)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timesheet_lock_weekday">Lock Day</Label>
                <Select
                  value={settings.timesheet_lock_weekday?.toString() ?? ''}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      timesheet_lock_weekday: value ? parseInt(value) : null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timesheet_lock_time">Lock Time</Label>
                <Input
                  id="timesheet_lock_time"
                  type="time"
                  value={settings.timesheet_lock_time ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timesheet_lock_time: e.target.value ? e.target.value : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Reminder Settings</h3>
            <p className="text-xs text-muted-foreground">
              Configure automated reminders (used in Stage 7)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reminder_frequency">Reminder Frequency</Label>
                <Select
                  value={settings.reminder_frequency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, reminder_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder_time">Reminder Time</Label>
                <Input
                  id="reminder_time"
                  type="time"
                  value={settings.reminder_time ?? ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reminder_time: e.target.value ? e.target.value : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              Settings saved successfully
            </div>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
