# Stage 6 Status - Milestones + Change Requests

## Current Task
- [x] Create database migrations
- [x] Implement server actions
- [x] Build UI components
- [x] Add to global search
- [x] Add automated tests
- [ ] Apply migration to Supabase
- [ ] Complete manual testing
- [ ] Build portal signing page (follow-up)

## Blockers
- Stage 5 (Xero/invoices) not yet complete - implementing without invoice FK for now
- Portal signing page NOT YET BUILT - client signature flow incomplete

## Completed
- [x] Branch created: claude/stage-6-plan-r8JpK
- [x] Migration file: 20260124000001_stage_6_milestones_change_requests.sql
- [x] Milestone data layer: lib/milestones/types.ts, lib/milestones/data.ts
- [x] Change request data layer: lib/change-requests/types.ts, lib/change-requests/data.ts
- [x] Server actions: milestone-actions.ts, change-request-actions.ts
- [x] UI components: milestones-view.tsx, change-requests-view.tsx, project-tabs.tsx
- [x] Global search integration: search API and command palette updated
- [x] TypeScript builds without errors
- [x] Automated tests: 60 tests across milestones, change requests, and search

## Test Coverage
| Test File | Tests | Status |
|-----------|-------|--------|
| lib/milestones/milestones.test.ts | 19 | ✅ Pass |
| lib/change-requests/change-requests.test.ts | 26 | ✅ Pass |
| tests/search-route.test.ts | 15 | ✅ Pass |
| **Total Stage 6 Tests** | **60** | ✅ |

## Scope
- Milestones per project (ordered list)
- Default deposit milestone (50% unless overridden)
- Auto-create Draft deposit invoice after proposal signed (deferred - needs Stage 5)
- Auto invoice when milestone complete (deferred - needs Stage 5)
- Change requests with client signature
- Add milestones and change requests to global search
- GST 10% applied to all amounts

## Known Limitations (for merge)
1. **Portal signing page missing** - `/portal/change-request/[token]` needs to be built
   - Client cannot sign/reject change requests via portal
   - Milestone auto-creation on signature cannot be tested
   - Recommend: Build as immediate follow-up or before merge
2. **Invoice integration deferred** - Requires Stage 5 (Xero)
   - invoice_id column included but FK constraint omitted

## Notes
- Manual testing checklist: `manual-tests/stage-6-pre-merge.md`
- Individual feature checklists: `manual-tests/milestones.md`, `manual-tests/change-requests.md`

## Files Changed
- `supabase/migrations/20260124000001_stage_6_milestones_change_requests.sql`
- `lib/milestones/types.ts`
- `lib/milestones/data.ts`
- `lib/milestones/milestones.test.ts`
- `lib/change-requests/types.ts`
- `lib/change-requests/data.ts`
- `lib/change-requests/change-requests.test.ts`
- `app/admin/projects/[id]/milestone-actions.ts`
- `app/admin/projects/[id]/change-request-actions.ts`
- `app/admin/projects/[id]/milestones-view.tsx`
- `app/admin/projects/[id]/change-requests-view.tsx`
- `app/admin/projects/[id]/project-tabs.tsx`
- `app/admin/projects/[id]/page.tsx`
- `app/api/search/route.ts`
- `components/search/command-palette.tsx`
- `tests/search-route.test.ts` (added in review)
- `manual-tests/stage-6-pre-merge.md` (added in review)
- `manual-tests/milestones.md`
- `manual-tests/change-requests.md`

---
*Last updated: 2026-01-27*
