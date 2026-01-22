# Stage 2 Status - Platform Foundations (Agency Settings)

## Current Task
- [ ] Run migration in Supabase Dashboard
- [ ] Test settings save/load end-to-end
- [ ] Complete manual testing checklist

## Blockers
- Migration needs to be applied to Supabase

## Completed
- [x] Database migration created (20260123000002_stage_2_agency_settings.sql)
  - agency_settings table with singleton constraint
  - deposit_percent column on agency_projects
  - RLS policies (view for all employees, edit for admins)
  - Auto-create default row on first load
  - updated_at trigger
- [x] Agency Settings UI card (components/agency-settings-card.tsx)
  - Business details: legal name, trade name, ABN
  - GST rate: read-only at 10%
  - Regional: currency (ISO), timezone (IANA)
  - Invoice: prefix, terms, deposit %, due days
  - Timesheet lock: weekday + time
  - Reminders: frequency + time
- [x] Server actions (app/admin/settings/actions.ts)
  - getAgencySettings: fetch or create default
  - updateAgencySettings: save changes
- [x] Integration files copied from jarve-website
  - lib/integrations/xero/client.ts
  - lib/integrations/stripe/client.ts
  - lib/integrations/portal/client.ts + types.ts
  - Stripe package installed

## Scope
- Single-row agency_settings table
- Settings UI on existing settings page
- GST fixed at 10% (read-only)
- Default deposit 50% with project override
- Currency, timezone, invoice prefix/terms
- Timesheet lock schedule (stored for later)
- Reminder settings (stored for Stage 7)
- Early integration file copy from jarve-website

## Files Changed
- `supabase/migrations/20260123000002_stage_2_agency_settings.sql` (new)
- `app/admin/settings/actions.ts` (new)
- `app/admin/settings/page.tsx` (updated - added AgencySettingsCard)
- `components/agency-settings-card.tsx` (new)
- `lib/integrations/xero/client.ts` (new)
- `lib/integrations/stripe/client.ts` (new)
- `lib/integrations/portal/client.ts` (new)
- `lib/integrations/portal/types.ts` (new)

## Next Steps
1. Apply migration to Supabase Dashboard
2. Test settings page loads and saves
3. Run manual test checklist
4. Sign off stage 2

---
*Last updated: 2026-01-23*
