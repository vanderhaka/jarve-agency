'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Building2 } from 'lucide-react'
import { useAgencySettings } from './use-agency-settings'
import { AgencyInfo } from './agency-info'
import { InvoiceSettings } from './invoice-settings'
import { TimesheetSettings } from './timesheet-settings'

export function AgencySettingsCard() {
  const {
    loading,
    saving,
    error,
    success,
    settings,
    setSettings,
    handleSubmit,
    LOAD_ERROR_MESSAGE,
  } = useAgencySettings()

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
          <AgencyInfo settings={settings} setSettings={setSettings} />
          <InvoiceSettings settings={settings} setSettings={setSettings} />
          <TimesheetSettings settings={settings} setSettings={setSettings} />

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
