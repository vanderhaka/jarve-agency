# Stage 1 Status - Lead to Project Conversion

## Current Task
- [x] Apply migration via Supabase (DONE - 2026-01-23)
- [x] Manual test conversion flow (DONE - 2026-01-23)
- [x] Sign off stage 1 (DONE - 2026-01-23)

## Blockers
- None - STAGE 1 COMPLETE ✅

## Completed
- [x] Database migration created (20260123000001_stage_1_lead_to_project.sql)
  - Added leads columns: client_id, project_id, converted_at, archived_at, archived_by
  - Created client_users table
  - Created client_portal_tokens table
  - Added RLS policies for new tables
- [x] Server action created (app/admin/leads/actions.ts)
  - convertLeadToProject: Creates client + project + archives lead
  - archiveLead: Archive without converting
  - restoreLead: Restore archived (non-converted) lead
- [x] Convert to Project UI added (components/convert-lead-dialog.tsx)
  - Button on lead detail page
  - Modal with project name, type, status, owner fields
  - Shows conversion info after lead is converted
- [x] Archived leads filtering added
  - Toggle in leads list header
  - Filters both list and kanban views
  - URL parameter ?archived=true for direct linking
- [x] Manual UI Testing (2026-01-23)
  - Convert dialog opens correctly
  - Form pre-fills project name from lead
  - Conversion creates client + project
  - Lead archived and marked as converted
  - Archived filter toggle works (?archived=true URL)
  - Converted lead shows status badges
  - View Client/Project links functional
  - Convert button hidden on converted leads

## Not Started
- [ ] Unit tests for conversion logic (deferred to later)

## Known Issues
- None

## Files Changed
- `supabase/migrations/20260123000001_stage_1_lead_to_project.sql` (new)
- `app/admin/leads/actions.ts` (new)
- `components/convert-lead-dialog.tsx` (new)
- `app/admin/leads/[id]/page.tsx` (updated - convert button, archived badges)
- `app/admin/leads/page.tsx` (updated - archived filter toggle)

## Next Steps
- Stage 1 complete - proceed to Stage 2

---
*Last updated: 2026-01-23*
*Signed off: 2026-01-23*
