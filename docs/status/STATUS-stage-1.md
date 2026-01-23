# Stage 1 Status - Lead to Project Conversion

## Current Task
- [x] Apply migration via Supabase (DONE - 2026-01-23)
- [ ] Manual test conversion flow
- [ ] Sign off stage 1

## Blockers
- None - ready for testing

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

## Not Started
- [ ] Unit tests for conversion logic
- [ ] Manual testing

## Known Issues
- None yet

## Files Changed
- `supabase/migrations/20260123000001_stage_1_lead_to_project.sql` (new)
- `app/admin/leads/actions.ts` (new)
- `components/convert-lead-dialog.tsx` (new)
- `app/admin/leads/[id]/page.tsx` (updated - convert button, archived badges)
- `app/admin/leads/page.tsx` (updated - archived filter toggle)

## Next Steps
1. Apply migration to Supabase
2. Run manual test checklist
3. Write unit tests if time permits
4. Sign off stage 1

---
*Last updated: 2026-01-23*
