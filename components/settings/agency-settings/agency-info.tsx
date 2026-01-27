import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENCIES, TIMEZONES, type AgencySettings } from '@/app/admin/settings/constants'

interface AgencyInfoProps {
  settings: AgencySettings
  setSettings: (settings: AgencySettings) => void
}

export function AgencyInfo({ settings, setSettings }: AgencyInfoProps) {
  return (
    <>
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
    </>
  )
}
