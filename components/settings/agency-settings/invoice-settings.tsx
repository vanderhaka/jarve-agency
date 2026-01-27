import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AgencySettings } from '@/app/admin/settings/constants'

interface InvoiceSettingsProps {
  settings: AgencySettings
  setSettings: (settings: AgencySettings) => void
}

export function InvoiceSettings({ settings, setSettings }: InvoiceSettingsProps) {
  return (
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
  )
}
