# Stage 1 — Lead to Project Conversion

## Goal
Convert a lead into a real client + project with one action, then archive the lead.

## Preconditions
- Stage 0 complete.
- Leads list + detail view working.

## Scope (In)
- Add conversion action + UI.
- Create client if needed.
- Create project.
- Archive the lead (remove from default list).

## Scope (Out)
- Proposals/contracts (Stage 3).
- Portal (Stage 4).

## Data Model Changes
Add these columns to `leads`:
```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES agency_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON leads(archived_at);
```

Create client users table (for portal access in later stages):
```sql
CREATE TABLE client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_viewed_at timestamptz,
  view_count int NOT NULL DEFAULT 0
);
```

## Server Actions / API
Create a server action `convertLeadToProject(leadId, input)` that:
1) Fetches lead by id.
2) If a client exists with the same email, use it. Else create a new client.
3) **Auto-create a `client_user`** from the lead's contact name + email (first user for this client).
4) Create a new project (`agency_projects`) using lead name/company as default.
5) Update the lead:
   - `status = 'converted'`
   - `archived_at = now()`
   - `converted_at = now()`
   - `client_id` and `project_id` set

**Note:** This action must be transactional (all-or-nothing). Use Supabase RPC or sequential updates with explicit rollback.

## UI Changes
- Lead detail page: add “Convert to Project” button.
- Conversion modal fields:
  - Project name (default from lead name/company)
  - Project type (optional)
  - Project status (default: “planning”)
- Leads list page:
  - Filter out `archived_at IS NOT NULL` by default.
  - Add “Show archived” toggle.

## Tests

### Automated
- Unit test: conversion creates client if missing.
- Unit test: conversion reuses existing client if email matches.
- Unit test: conversion auto-creates client_user from lead contact data.
- Unit test: lead is archived and linked to client + project.

### Manual
- `manual-tests/lead-to-project.md`

## Known Risks
- Email matching for existing clients may have false positives (different person, same email)
- Transaction failure mid-conversion leaves lead in inconsistent state
- Client user auto-creation may duplicate if lead has multiple contacts

## Rollback Procedure
If this stage fails:
1. Migration rollback: `DROP TABLE client_portal_tokens; DROP TABLE client_users;`
2. Remove added columns: `ALTER TABLE leads DROP COLUMN client_id, project_id, converted_at, archived_at, archived_by;`
3. Revert UI changes via git
4. Re-test leads pipeline

## Done Definition
- Convert button works from lead detail.
- Client + project created in one action.
- Lead is hidden from default list and visible in archived view.
- All tests pass and manual checklist signed.
