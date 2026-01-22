# Stage 0 — Foundation Fixes (Before New Features)

## Goal
Remove broken/ambiguous parts and fix existing bugs so the current app is stable and consistent before adding new features.

## Preconditions
- None.

## Scope (In)
- Remove lead-task UI that references non-existent DB columns.
- Clarify that interaction timeline is internal-only notes (not client comms).
- Fix leads kanban drag-and-drop functionality.
- Fix leads list auto-refresh when new lead is created.
- Enable external lead submission from website (RLS + API route).

## Scope (Out)
- No portal, proposals, invoices, Xero, or reminders.

## Step-by-step Tasks

### Step 1 — Remove Lead Tasks UI ✅ DONE
**Problem:** `components/task-dialog.tsx` uses `lead_id` + `assigned_to`, but `tasks` table does not have those columns.

**Action:**
- Remove the `TaskDialog` usage from `app/admin/leads/[id]/page.tsx`.
- Delete `components/task-dialog.tsx` (was only used for leads).

**Files:**
- `app/admin/leads/[id]/page.tsx`
- `components/task-dialog.tsx` (deleted)

### Step 2 — Interaction Timeline Copy ✅ DONE
**Problem:** It implies client communication, but portal chat is the source of truth.

**Action:**
- Update text to "Add Internal Note" / "Internal Timeline".
- Keep types as-is (call/meeting/note) but treat all entries as internal.

**Files:**
- `components/interaction-timeline.tsx`

### Step 3 — Fix Leads Kanban Drag-and-Drop
**Problem:** Drag-and-drop appears broken. Investigation found:
- Uses @dnd-kit but state doesn't sync properly between page and kanban component
- Kanban maintains local state separate from page state
- `router.refresh()` doesn't properly update kanban component's internal state

**Root Cause:** State isolation between `app/admin/leads/page.tsx` and `components/leads-kanban.tsx`.

**Action:**
- Lift state management to page level OR
- Add Supabase Realtime subscription to sync state
- Ensure optimistic updates work correctly with DB persistence
- Add error handling with rollback if DB update fails

**Files:**
- `app/admin/leads/page.tsx`
- `components/leads-kanban.tsx`

### Step 4 — Fix New Lead Auto-Refresh
**Problem:** After creating a new lead via `NewLeadDialog`, the leads list doesn't update automatically — requires manual page refresh.

**Root Cause:**
- Leads are fetched once on mount via `useEffect`
- No Supabase Realtime subscriptions for INSERT events
- `router.refresh()` in dialog doesn't reliably update parent component state

**Action:**
- Add Supabase Realtime subscription for `leads` table (INSERT, UPDATE, DELETE)
- Update state reactively when changes occur
- Remove reliance on `router.refresh()` for data consistency

**Files:**
- `app/admin/leads/page.tsx`
- `components/new-lead-dialog.tsx`

### Step 5 — Enable External Lead Submission
**Problem:** Leads from the main website cannot be submitted to the CRM.
- Contact form exists at `/` (homepage) using Supabase anon key
- RLS policy blocks anonymous inserts (requires `is_employee()`)
- No API route for external lead submission

**Action:**
Option A (Quick): Add anonymous RLS policy for lead inserts
```sql
CREATE POLICY "Allow anonymous lead submission"
  ON leads FOR INSERT TO anon
  WITH CHECK (true);
```

Option B (Recommended): Create secure API route
- Create `/app/api/leads/route.ts` with POST handler
- Add validation (email format, required fields)
- Add rate limiting to prevent spam
- Return created lead ID for confirmation

**Decision:** Use Option B (API route) for better security and auditability.

**Files:**
- `app/api/leads/route.ts` (new)
- `supabase/migrations/YYYYMMDD_XX_lead_submission_rls.sql` (if needed)

## Tests

### Automated
- Test: Lead status update persists to database
- Test: New lead via API route creates record with correct fields
- Test: API route validates required fields (name, email)
- Test: API route rejects invalid email format

### Manual
- `manual-tests/leads-pipeline.md`

## Known Risks
- Realtime subscriptions add WebSocket connection overhead
- API route without rate limiting could be abused for spam
- State refactoring may introduce temporary regressions

## Rollback Procedure
If this stage fails:
1. Revert the component changes via git
2. Drop any new migrations if applied
3. Re-test leads pipeline

## Done Definition
- Lead detail page has no tasks UI ✅
- Internal Notes terminology applied ✅
- Kanban drag-and-drop updates status and persists after refresh
- New lead appears automatically without page refresh
- External leads from website successfully create records in CRM
- All manual checklist items pass
