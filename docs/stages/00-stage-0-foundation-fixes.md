# Stage 0 — Foundation Fixes (Before New Features)

## Goal
Remove broken/ambiguous parts so the current app is stable and consistent before adding new features.

## Preconditions
- None.

## Scope (In)
- Remove lead-task UI that references non-existent DB columns.
- Clarify that interaction timeline is internal-only notes (not client comms).
- Ensure leads pipeline still works exactly as it does now.

## Scope (Out)
- No new tables.
- No portal, proposals, invoices, Xero, or reminders.

## Step-by-step Tasks

### Step 1 — Remove Lead Tasks UI
**Problem:** `components/task-dialog.tsx` uses `lead_id` + `assigned_to`, but `tasks` table does not have those columns.

**Action:**
- Remove the `TaskDialog` usage from `app/app/leads/[id]/page.tsx`.
- Keep project tasks only (kanban board in project detail is the official tasks UI).

**Files:**
- `app/app/leads/[id]/page.tsx`
- `components/task-dialog.tsx` (optional: delete if unused)

### Step 2 — Interaction Timeline Copy
**Problem:** It implies client communication, but portal chat is the source of truth.

**Action:**
- Update text to “Internal Notes / Internal Timeline”.
- Keep types as-is (call/meeting/note) but treat all entries as internal.

**Files:**
- `components/interaction-timeline.tsx`

### Step 3 — Lead Pipeline Stays Same
**Action:**
- Confirm `/app/leads` list + kanban unchanged.


## Tests

### Automated
- None required in Stage 0.

### Manual
- `manual-tests/leads-pipeline.md`

## Known Risks
- Removing TaskDialog may break other pages that use it legitimately (project tasks)
- Text changes to "Internal Notes" may not be reflected everywhere

## Rollback Procedure
If this stage fails:
1. Revert the component changes via git
2. No database changes to undo
3. Re-test leads pipeline

## Done Definition
- Lead detail page has no tasks UI.
- No code references `lead_id` or `assigned_to` in the `tasks` table context.
- Leads list + kanban still work and pass manual checklist.
