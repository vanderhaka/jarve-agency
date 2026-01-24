# Stage 2 Status - Platform Foundations (Agency Settings)

## Current Task
- [x] Run migration in Supabase Dashboard
- [x] Test settings page loads correctly
- [x] Test settings save/load end-to-end
- [x] Complete manual testing checklist

## Blockers
None - **STAGE 2 COMPLETE** ✅

## Completed
- [x] Database migration applied to Supabase
  - agency_settings table created
  - RLS policies (SELECT for employees, INSERT/UPDATE for admins)
  - Fixed column reference (employees.id instead of auth_id)
  - Default settings row inserted
  - updated_at trigger working
- [x] Fixed "use server" export error
  - Moved interfaces and constants to constants.ts
  - Server actions file now only exports async functions
- [x] Agency Settings UI card verified working
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
- `supabase/migrations/20260123000002_stage_2_agency_settings.sql` (updated - fixed employees.id)
- `app/admin/settings/actions.ts` (updated - removed non-async exports)
- `app/admin/settings/constants.ts` (new - types and constants)
- `app/admin/settings/page.tsx` (updated - added AgencySettingsCard)
- `components/agency-settings-card.tsx` (updated - import from constants)
- `lib/integrations/xero/client.ts` (new)
- `lib/integrations/stripe/client.ts` (new)
- `lib/integrations/portal/client.ts` (new)
- `lib/integrations/portal/types.ts` (new)
- `lib/settings/agency.ts` (new - testable business logic)
- `tests/agency-settings.test.ts` (new - 36 unit tests)

## Automated Tests
- [x] Unit tests for settings logic (tests/agency-settings.test.ts)
  - DEFAULT_SETTINGS: 4 tests
  - FIXED_GST_RATE: 1 test
  - stripGstRate: 3 tests
  - validateSettingsInput: 17 tests
  - performGetAgencySettings: 4 tests
  - performUpdateAgencySettings: 7 tests
  - Total: 36 tests

## Next Steps
None - Stage 2 complete

---
*Last updated: 2026-01-23*
