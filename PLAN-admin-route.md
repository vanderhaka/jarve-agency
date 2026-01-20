# Ensemble Execution Plan

**Status**: Executing
**Complexity**: 15/100 → 1 agent

## Questions & Clarifications
None - straightforward route relocation.

## Objective
Move admin section from `/app/admin/*` to `/admin/*` for cleaner URLs.

## Agent Type: nextjs-developer

## Tasks

### Phase 1: Create New Admin Route Structure
1. Create `app/admin/layout.tsx` with auth protection
2. Create `app/admin/employees/page.tsx`
3. Create `app/admin/audit/page.tsx`

### Phase 2: Update Navigation
1. Update links in `app/app/layout.tsx` to point to `/admin/*`

### Phase 3: Cleanup
1. Delete old `app/app/admin/` directory

## Files to Modify
- `app/admin/layout.tsx` (create)
- `app/admin/employees/page.tsx` (create)
- `app/admin/audit/page.tsx` (create)
- `app/app/layout.tsx` (update links)
- `app/app/admin/` (delete)
