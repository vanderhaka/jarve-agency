# Stage 6 Status - Milestones + Change Requests

## Current Task
- [x] Create database migrations
- [x] Implement server actions
- [x] Build UI components
- [x] Add to global search
- [ ] Apply migration to Supabase
- [ ] Complete manual testing

## Blockers
- Stage 5 (Xero/invoices) not yet complete - implementing without invoice FK for now

## Completed
- [x] Branch created: claude/stage-6-plan-r8JpK
- [x] Migration file: 20260124000001_stage_6_milestones_change_requests.sql
- [x] Milestone data layer: lib/milestones/types.ts, lib/milestones/data.ts
- [x] Change request data layer: lib/change-requests/types.ts, lib/change-requests/data.ts
- [x] Server actions: milestone-actions.ts, change-request-actions.ts
- [x] UI components: milestones-view.tsx, change-requests-view.tsx, project-tabs.tsx
- [x] Global search integration: search API and command palette updated
- [x] TypeScript builds without errors

## Scope
- Milestones per project (ordered list)
- Default deposit milestone (50% unless overridden)
- Auto-create Draft deposit invoice after proposal signed (deferred - needs Stage 5)
- Auto invoice when milestone complete (deferred - needs Stage 5)
- Change requests with client signature
- Add milestones and change requests to global search
- GST 10% applied to all amounts

## Notes
- Invoice integration deferred until Stage 5 complete
- invoice_id column included but FK constraint omitted for now
- Portal signing page for change requests needs to be created (portal/change-request/[token])

## Files Changed
- `supabase/migrations/20260124000001_stage_6_milestones_change_requests.sql`
- `lib/milestones/types.ts`
- `lib/milestones/data.ts`
- `lib/change-requests/types.ts`
- `lib/change-requests/data.ts`
- `app/admin/projects/[id]/milestone-actions.ts`
- `app/admin/projects/[id]/change-request-actions.ts`
- `app/admin/projects/[id]/milestones-view.tsx`
- `app/admin/projects/[id]/change-requests-view.tsx`
- `app/admin/projects/[id]/project-tabs.tsx`
- `app/admin/projects/[id]/page.tsx`
- `app/api/search/route.ts`
- `components/search/command-palette.tsx`

---
*Last updated: 2026-01-24*
