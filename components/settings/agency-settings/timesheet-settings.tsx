import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WEEKDAYS, REMINDER_FREQUENCIES, type AgencySettings } from '@/app/admin/settings/constants'

interface TimesheetSettingsProps {
  settings: AgencySettings
  setSettings: (settings: AgencySettings) => void
}

export function TimesheetSettings({ settings, setSettings }: TimesheetSettingsProps) {
  return (
    <>
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
    </>
  )
}
