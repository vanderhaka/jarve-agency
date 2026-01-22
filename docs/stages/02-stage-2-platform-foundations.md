# Stage 2 - Platform Foundations (Agency Settings)

## Goal
Create a single place to store business defaults (GST, deposit, invoice terms, timesheet lock). These defaults feed later stages so we are not hard-coding values.

## Preconditions
- Stage 0 complete.
- Stage 1 complete.

## Scope (In)
- Agency settings table (single row).
- Settings UI added to the existing Settings page.
- Default deposit percent (50%) with per-project override option.
- GST fixed at 10% (stored for reference).
- Default currency, timezone, invoice prefix, invoice terms (text + optional days for future use).
- Timesheet weekly lock schedule (stored for later use).
- Reminder schedule settings (daily, configurable in settings) stored for Stage 7.
- Keep global search working (no regressions).
- **Early integration file copy** from `jarve-website` into `lib/integrations/` for validation.

## Scope (Out)
- No proposals, portal, invoices, or milestones yet.
- No background jobs yet (lock job is Stage 7).

## Data Model Changes
Create a single-row table for settings:
```sql
CREATE TABLE agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true,
  legal_name text,
  trade_name text,
  abn text,
  gst_rate numeric NOT NULL DEFAULT 0.10,
  default_currency text NOT NULL DEFAULT 'AUD',
  timezone text NOT NULL DEFAULT 'Australia/Adelaide',
  invoice_prefix text NOT NULL DEFAULT 'INV',
  invoice_terms text,
  invoice_terms_days int, -- optional, not used for due dates yet
  default_deposit_percent numeric NOT NULL DEFAULT 0.50,
  timesheet_lock_weekday int, -- 0=Sun .. 6=Sat
  timesheet_lock_time time,
  reminder_frequency text NOT NULL DEFAULT 'daily',
  reminder_time time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_settings_singleton ON agency_settings(singleton);
```

Optional project override (only if not already in schema):
```sql
ALTER TABLE agency_projects
  ADD COLUMN IF NOT EXISTS deposit_percent numeric;
```

Notes:
- Use a single settings row (enforced with `singleton` unique index). If none exists, create it on first load.
- GST must stay at 10% even if shown in the UI.
- Currency list should use ISO 4217 values; timezone list should use full IANA set.
- Invoice due date remains “issue date” for now; `invoice_terms_days` is stored for future use.
- Deposit override is set only at project creation.

## UI Changes
- Extend `app/admin/settings/page.tsx` with a new "Agency Settings" card.
- Fields: legal name, ABN, currency (ISO list), timezone (IANA list), invoice prefix/terms (text + optional days), default deposit %, timesheet lock day/time, reminder frequency/time.
- GST field should show 10% and be read-only.
- Add optional "Deposit %" field to the New Project dialog (defaults to agency settings).

## Integration File Copy (Early Validation)
Copy these files from `/Users/jamesvanderhaak/Desktop/Development/jarve-website` into `lib/integrations/`:
- `lib/xero/client.ts` → `lib/integrations/xero/client.ts`
- `lib/stripe/client.ts` → `lib/integrations/stripe/client.ts`
- `app/actions/clientPortal.ts` → `lib/integrations/portal/clientPortal.ts`
- `types/clientPortal.ts` → `types/clientPortal.ts`

**Purpose:** Validate compatibility with current Next.js version and dependencies before Stage 5. Fix any import/type issues now rather than discovering them later.

**Note:** These files are not wired up yet - just copied and verified to compile.

## Data Flow
- Settings are read once and cached for the session.
- New projects use `default_deposit_percent` unless a project override is set.
- Later stages (invoicing, milestones, time tracking) will read from this table.

## Tests

### Automated
- Unit test: settings row is created on first load.
- Unit test: settings update persists and returns on next fetch.

### Manual
- `manual-tests/agency-settings.md`
- `manual-tests/search.md`

## Known Risks
- Single-row settings pattern may cause race conditions on concurrent updates
- Integration files from jarve-website may have incompatible dependencies
- Cached settings may become stale if updated in another session

## Rollback Procedure
If this stage fails:
1. Migration rollback: `DROP TABLE agency_settings; ALTER TABLE agency_projects DROP COLUMN deposit_percent;`
2. Remove copied integration files from `lib/integrations/`
3. Revert UI changes via git

## Done Definition
- Agency settings save and load correctly.
- GST displays as 10% and cannot be changed.
- New projects default to 50% deposit (unless overridden).
- Manual checklist signed.
