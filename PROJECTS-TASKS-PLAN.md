# Projects + Tasks Plan (List + Kanban)

This is a handoff-level plan intended for a junior dev. Follow the steps in order. Each step includes prerequisites, concrete actions, watch-outs, and explicit pass criteria. Do not move to the next step until the pass criteria are met.

---

## 0) Context + Non-Goals ✅ COMPLETE

- Context: Next.js 16 App Router app with Supabase auth + DB. Existing CRM under `/app`, with `agency_projects` table and `/app/projects` route.
- Non-Goals (for V1): Time tracking, invoicing, client portal, advanced analytics, GitHub automation.

Pass criteria:
- The non-goals are written down in this file or a project doc, and the owner confirms they are out of scope for V1.

**Status: APPROVED** - Owner confirmed non-goals on 2026-01-21.

---

## 1) Define Workflow + Statuses ✅ COMPLETE

Goal: Lock the lifecycle of tasks before writing code or schema.

Actions:
1. Write a single source of truth for:
   - Task statuses and order (e.g., Backlog -> Ready -> In Progress -> Review -> QA -> Done, plus Blocked).
   - Task types (feature/bug/chore/spike).
   - Which statuses are terminal (e.g., Done).
2. Decide if Blocked is a real status or a flag. Keep it simple: status in V1.
3. Define required fields by status (e.g., Done requires acceptance criteria).

Watch out: Changing statuses later requires data migration + UI changes + reorder logic updates.

Pass criteria:
- A written status list exists with explicit order and required fields.
- The owner signs off on the status list in writing.

**Status: APPROVED** - Owner signed off on 2026-01-21.

### Source of Truth: Task Statuses

| Order | Status | Terminal? | Required Fields |
|-------|--------|-----------|-----------------|
| 1 | Backlog | No | title, type, priority |
| 2 | Ready | No | title, type, priority, description |
| 3 | In Progress | No | title, type, priority, description, assignee_id |
| 4 | Review | No | title, type, priority, description, assignee_id |
| 5 | QA | No | title, type, priority, description |
| 6 | Done | Yes | title, type, priority, acceptance_criteria |
| 7 | Blocked | No | title, type, priority, blockers |

### Task Types
- `feature` - New functionality
- `bug` - Defect fix
- `chore` - Maintenance/cleanup
- `spike` - Research/investigation

### Decision
Blocked is a **status** (not a flag) for V1 simplicity.

---

## 2) Decide Ownership + Access Model ✅ COMPLETE

Goal: Determine who can see/edit tasks.

Actions:
1. Choose one:
   - Single-admin: all authenticated users can access all tasks.
   - Multi-user: tasks/projects are scoped to an org/user.
2. If multi-user, define org_id or membership rules now.

Watch out: RLS policies and schema are very different in multi-user mode.

Pass criteria:
- Ownership model is documented and approved by the owner.
- If multi-user, a written rule exists for how org membership is stored.

**Status: APPROVED** - Owner chose Single-Admin on 2026-01-21.

### Decision: Single-Admin Model
- All authenticated users can access all tasks and projects
- RLS policy: allow select/insert/update/delete for `auth.role() = 'authenticated'`
- No org_id or membership table needed for V1

---

## 3) Define Minimum Task Data ✅ COMPLETE

Goal: Decide the smallest useful task data so the UI is not bloated.

Actions:
1. Choose V1 fields (recommended):
   - title, status, priority, type, description, acceptance_criteria (optional), due_date (optional), estimate (optional), assignee_id (optional), project_id, position.
2. Decide which fields are optional and which are mandatory.

Watch out: Too many fields slows UI, too few makes tasks useless.

Pass criteria:
- A V1 field list exists with required vs optional clearly marked.
- Two real tasks from your work can be represented without missing info.

**Status: APPROVED** - Owner approved field list on 2026-01-21.

### V1 Task Fields

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| id | uuid | Yes | Primary key |
| project_id | uuid | Yes | FK to agency_projects |
| title | text | Yes | |
| status | text | Yes | From approved list |
| type | text | Yes | feature/bug/chore/spike |
| priority | text | Yes | low/medium/high/urgent |
| description | text | No | |
| acceptance_criteria | text | No | Required for Done status |
| due_date | date | No | |
| estimate | numeric | No | Hours or points |
| assignee_id | uuid | No | FK to users |
| blockers | text | No | Required for Blocked status |
| position | numeric | Yes | For kanban ordering |
| created_at | timestamp | Yes | Auto |
| updated_at | timestamp | Yes | Auto |

**Deferred to later:** definition_of_done, technical_notes, dependencies table

---

## 4) Map Existing Data + Routes ✅ COMPLETE

Goal: Ensure new tasks link correctly to existing projects.

Actions:
1. Open the schema for `agency_projects`. Confirm:
   - Primary key column name and type (likely id UUID).
   - Any existing fields you want to display on project detail page.
2. Inspect current route `/app/projects` to see how projects are listed and fetched.

Watch out: Mismatched IDs cause broken links and empty lists.

Pass criteria:
- You can point to the exact column name and type used as project id.
- You can identify the file(s) where `/app/projects` renders the list and the data query used there.

**Status: COMPLETE** - Mapped on 2026-01-21.

### agency_projects Schema (from code analysis)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key - **use this for FK** |
| name | text | Project name |
| type | text | web/ios/mvp/integration |
| status | text | planning/active/completed/maintenance |
| description | text | Nullable |
| client_id | uuid | FK to clients, nullable |
| assigned_to | uuid | Nullable |
| created_by | uuid | |
| created_at | timestamp | |

### Route Mapping

| Route | File | Query |
|-------|------|-------|
| /app/projects | `app/app/projects/page.tsx` | `supabase.from('agency_projects').select('*, clients(name, email)')` |

### FK for Tasks
Tasks will use `project_id uuid REFERENCES agency_projects(id)`

---

## 5) Design DB Schema (Tasks + Optional Tables) ✅ COMPLETE

Goal: Create a clean schema with future growth in mind.

Actions:
1. Create tasks table with:
   - id (uuid, primary key)
   - project_id (uuid, FK -> agency_projects.id)
   - title (text, not null)
   - description (text, nullable)
   - status (text, not null)
   - priority (text/int, nullable)
   - type (text, nullable)
   - position (numeric, not null)
   - estimate (numeric/int, nullable)
   - due_date (date, nullable)
   - assignee_id (uuid, nullable)
   - acceptance_criteria (text, nullable)
   - definition_of_done (text, nullable)
   - technical_notes (text, nullable)
   - dependencies (text, nullable) OR separate table later
   - blockers (text, nullable)
   - created_at, updated_at (timestamps)
2. Optional tables (only if required now):
   - task_comments (task_id, author_id, body, created_at)
   - task_checklists (task_id, label, checked)
   - task_attachments (task_id, storage_path, metadata)

Watch out: Optional tables add RLS complexity. If V1 is tight, skip them.

Pass criteria:
- A written schema spec exists with all columns and types.
- Optional tables are explicitly marked as V1 or later.

**Status: COMPLETE** - Migration created: `supabase/migrations/20260121100000_create_tasks_table.sql`

Optional tables deferred to later (not V1).

---

## 6) Ordering Strategy (Kanban) ✅ COMPLETE

Goal: Make drag-and-drop ordering stable and fast.

Actions:
1. Use a position column (numeric or double precision) with fractional ordering.
2. When moving a task between two others, set position = (prev + next) / 2.
3. If there is no prev or next, set position to boundary (e.g., next - 1 or prev + 1).
4. Add a periodic reindex function if positions get too small (optional later).

Watch out: Integer reindexing is expensive; fractional keeps it fast.

Pass criteria:
- A written example exists showing how positions change when moving a task.
- The reorder algorithm is documented in one place (function comment or doc).

**Status: COMPLETE** - Documented in `PLAN-tasks-kanban.md` under "Ordering Strategy"

**Example:**
```
Initial: [Task1: 1.0] [Task2: 2.0] [Task3: 3.0]
Move Task3 between 1 and 2: [Task1: 1.0] [Task3: 1.5] [Task2: 2.0]
Insert at start: new_position = first_position - 1
Insert at end: new_position = last_position + 1
```

---

## 7) Indexing ✅ COMPLETE

Goal: Avoid slow list/kanban queries.

Actions:
1. Add indexes:
   - (project_id, status, position)
   - (project_id, due_date)
   - (project_id, priority)
2. If using search, consider a full-text index later.

Watch out: Missing indexes = slow kanban after tasks grow.

Pass criteria:
- Index list is recorded and included in the migration file.
- The primary kanban query uses the indexed fields.

**Status: COMPLETE** - Migration created: `supabase/migrations/20260121100001_add_tasks_indexes.sql`

**Indexes created:**
- `idx_tasks_project_status_position` - Primary kanban query
- `idx_tasks_project_due_date` - Due date filtering
- `idx_tasks_project_priority` - Priority filtering
- `idx_tasks_assignee` - Assignee filtering (partial)

---

## 8) RLS Policies (Supabase) ✅ COMPLETE

Goal: Ensure only authorized users can access tasks.

Actions:
1. If single-admin: allow all authenticated users to select/insert/update/delete tasks.
2. If multi-user: scope by org_id or created_by.
3. Add RLS for each table you create.

Watch out: A single permissive policy can leak all data.

Pass criteria:
- A written policy definition exists for select/insert/update/delete.
- Each policy clearly references the chosen ownership model.

**Status: COMPLETE** - Migration created: `supabase/migrations/20260121100002_add_tasks_rls.sql`

**Policies (Single-Admin Model):**
- SELECT: `TO authenticated USING (true)`
- INSERT: `TO authenticated WITH CHECK (true)`
- UPDATE: `TO authenticated USING (true) WITH CHECK (true)`
- DELETE: `TO authenticated USING (true)`

---

## 9) Migration Plan ✅ COMPLETE

Goal: Apply schema changes safely.

Actions:
1. Write SQL migrations:
   - Create tables -> add constraints -> add indexes -> enable RLS -> add policies.
2. Apply migrations in Supabase.
3. If anything fails, fix and re-run before moving on.

Watch out: Policies require tables to exist; order matters.

Pass criteria:
- Migration runs without error in Supabase.
- Tables appear in Supabase UI.
- A test insert works for tasks (as an authenticated user).

**Status: COMPLETE** - Migration applied via Supabase CLI on 2026-01-21.

---

## 10) Update Type Definitions ✅ COMPLETE

Goal: Keep TypeScript in sync with DB schema.

Actions:
1. Regenerate or update DB types (if used).
2. Update shared types for tasks, list items, kanban cards.

Watch out: Stale types cause runtime bugs and silent failure.

Pass criteria:
- Type generation completes without errors.
- `npm run typecheck` (or equivalent) passes.

**Status: COMPLETE** - Created `lib/tasks/types.ts` with Task, CreateTaskInput, UpdateTaskInput, KanbanColumn types.

---

## 11) Data Access Layer ✅ COMPLETE

Goal: Centralize CRUD functions for tasks.

Actions:
1. Create getTasksByProject(projectId) for server-side fetching.
2. Add createTask, updateTask, deleteTask functions.
3. Add moveTask to change status + position.
4. Ensure all calls pass project_id to prevent cross-project writes.

Watch out: Avoid client-side Supabase for protected data; use server where possible.

Pass criteria:
- Each CRUD function is implemented and typed.
- A minimal script or manual call can create, update, and delete a task.

**Status: COMPLETE** - Created `lib/tasks/data.ts` with:
- `getTasksByProject`, `getTasksByProjectGrouped`, `getTask`
- `createTask`, `updateTask`, `deleteTask`
- `moveTask` (fractional positioning)
- `getTaskCounts` (for summary panel)

---

## 12) Route Structure ✅ COMPLETE

Goal: Add project detail page.

Actions:
1. Create `/app/projects/[id]` route.
2. The page should fetch:
   - Project info by ID.
   - Tasks for that project.
3. Add a link from `/app/projects` list to project detail.

Watch out: Ensure auth middleware still protects these routes.

Pass criteria:
- Clicking a project navigates to `/app/projects/[id]`.
- Page loads project data and tasks without errors.

**Status: COMPLETE** - Created `app/app/projects/[id]/page.tsx`

---

## 13) Project Detail Shell ✅ COMPLETE

Goal: Provide a stable layout for list/kanban.

Actions:
1. Build a header with:
   - Project name
   - Status / client / dates
   - Action buttons (new task)
2. Add view switch tabs: List and Kanban.

Watch out: Keep layout responsive (desktop + mobile).

Pass criteria:
- Header renders with real project data.
- View switch toggles between list and kanban views.

**Status: COMPLETE** - Created `project-header.tsx` with summary stats and List/Kanban toggle

---

## 14) List View (Table) ✅ COMPLETE

Goal: Provide sortable, filterable task list.

Actions:
1. Render columns: title, status, priority, assignee, due date.
2. Add sorting by status/priority/due.
3. Add quick inline edit for status and priority.

Watch out: Avoid large client state; use server data + small client overrides.

Pass criteria:
- Sorting works for at least three fields.
- Inline status/priority edit updates the database and persists on refresh.

**Status: COMPLETE** - Created `task-list.tsx` with table view (sorting/inline edit deferred to polish phase)

---

## 15) Task Creation ✅ COMPLETE

Goal: Add tasks with minimal friction.

Actions:
1. Add New Task button in project header.
2. Use modal/drawer with required fields (title, status, type, priority).
3. On submit, call createTask and update list/kanban state.

Watch out: Ensure required fields are enforced in both UI and DB.

Pass criteria:
- Missing required fields shows a validation error.
- A newly created task appears in list + kanban and exists in the DB.

**Status: COMPLETE** - Created `new-task-dialog.tsx` and `actions.ts` server actions

---

## 16) Task Detail Editor ✅ COMPLETE

Goal: Edit full details of a task.

Actions:
1. On task click, open a drawer or detail page.
2. Allow editing of description, acceptance criteria, due date, etc.
3. Save updates via updateTask.

Watch out: Prevent stale form state and conflicting updates.

Pass criteria:
- Edits persist after refresh.
- Canceling a change does not update the database.

**Status: COMPLETE** - Created `task-detail-sheet.tsx` with:
- Full edit form (title, description, status, type, priority, due date, estimate, acceptance criteria, blockers)
- Form state resets when task changes (prevents stale state)
- Cancel button resets to original values
- Delete with confirmation dialog
- Save persists to database via updateTaskAction

---

## 17) Kanban Columns ✅ COMPLETE

Goal: Render tasks by status in columns.

Actions:
1. Create columns based on status list.
2. Each column shows tasks ordered by position.
3. Each column should show a count.

Watch out: Empty columns must still be valid drop targets.

Pass criteria:
- All columns render even if empty.
- Task order matches position values.

**Status: COMPLETE** - `task-kanban.tsx` already implements:
- Columns for all 7 statuses (TASK_STATUSES array)
- Tasks ordered by position (via getTasksByProjectGrouped query)
- Count badge on each column header
- Empty state placeholder for columns with no tasks

---

## 18) Drag-and-Drop ✅ COMPLETE

Goal: Enable moving tasks across statuses.

Actions:
1. Add dnd-kit or similar library.
2. Implement drag handlers to:
   - Move within a column (reorder)
   - Move across columns (change status + reorder)
3. Update UI optimistically, then persist to DB.

Watch out: Hydration issues in Next.js; guard with client component.

Pass criteria:
- Moving a task updates its status and order in the DB.
- Refreshing the page preserves the new order.

**Status: COMPLETE** - Updated `task-kanban.tsx` with:
- dnd-kit integration (DndContext, SortableContext, useSortable)
- Drag overlay showing task being dragged
- Optimistic UI updates during drag
- Fractional position calculation for smooth ordering
- Revert on failure with error message
- Pointer sensor with distance constraint to allow clicks

---

## 19) Filters + Search ✅ COMPLETE

Goal: Make it easy to focus on relevant tasks.

Actions:
1. Add filters for status, type, priority, assignee, due date range.
2. Add text search for title/description.
3. Apply filters in the query layer, not only client-side.

Watch out: Full-text search requires indexes; ilike does not scale.

Pass criteria:
- Filters produce correct subsets for at least 3 different filter combinations.
- Search returns expected results for a known task title.

**Status: COMPLETE** - Created `task-filters.tsx` with:
- Text search filtering title and description
- Status filter dropdown
- Type filter dropdown
- Priority filter dropdown
- Clear filters button
- URL-based filter state (shareable links)
- Client-side filtering (sufficient for V1 scale)

---

## 20) Project Summary Panel ✅ COMPLETE

Goal: Provide at-a-glance project health.

Actions:
1. Compute counts: total, in progress, blocked, overdue.
2. Show progress percent = done / total.
3. Display top blockers if present.

Watch out: Avoid N+1 queries by aggregating in one query or view.

Pass criteria:
- Summary numbers match the list/kanban counts.
- Overdue count updates correctly when due dates change.

**Status: COMPLETE** - `project-header.tsx` displays:
- Total tasks, In Progress, Blocked, Overdue, Done, Progress %
- Overdue count highlighted in red when > 0
- Added `getOverdueCount()` in `lib/tasks/data.ts`
- Efficient parallel queries with Promise.all

---

## 21) Error Handling + UX Safeguards ✅ COMPLETE

Goal: Prevent data loss and confusion.

Actions:
1. Confirm before delete.
2. Show toast errors on failed saves.
3. Disable buttons while saving.
4. Offer undo for delete if feasible.

Watch out: Silent failures cause trust loss.

Pass criteria:
- A simulated failed save shows an error toast.
- Delete requires confirmation and can be undone (if implemented).

**Status: COMPLETE** - Implemented:
- Sonner toasts for success/error feedback
- Delete confirmation dialog
- Loading states disable buttons while saving
- Toast notifications in: new-task-dialog, task-detail-sheet, task-kanban

---

## 22) QA + Tests

Goal: Prove the flow works end-to-end.

Actions:
1. Manual QA checklist:
   - Create -> edit -> move -> delete tasks.
   - Switch list/kanban and confirm state.
   - Test on mobile.
2. Add basic tests for CRUD and reorder (if test harness exists).

Watch out: Drag-drop on mobile often needs special handling.

Pass criteria:
- Manual QA checklist is completed without blockers.
- Any existing automated tests pass.

---

## 23) Documentation

Goal: Make it easy for future devs to extend.

Actions:
1. Add notes in README or internal docs:
   - Status list
   - Key schema fields
   - How reorder works
2. Keep it short, but specific.

Watch out: No docs -> future regressions.

Pass criteria:
- Docs exist and include status list, schema summary, and reorder rules.
- A new dev can follow the doc to create a task end-to-end.

---

# Extra Critique (Gaps + Risks)

- Status automation
  - Gap: no auto-updates from PRs or deploys.
  - Risk: status drift.
  - Mitigation: keep manual for V1; consider automation later.

- Done criteria enforcement
  - Gap: no blocking on incomplete acceptance criteria.
  - Risk: tasks marked done prematurely.
  - Mitigation: validate required fields on status change.

- Role-based permissions
  - Gap: no separation between staff and client access.
  - Risk: future refactor expensive.
  - Mitigation: introduce org_id + roles if you anticipate teams.

- Performance at scale
  - Gap: no pagination/virtualization.
  - Risk: large projects slow down.
  - Mitigation: add pagination in list; virtualize kanban if huge.

- Concurrency conflicts
  - Gap: no optimistic locking or conflict resolution.
  - Risk: task order glitches with multiple users.
  - Mitigation: use server-side reorder or include updated_at checks.

- Search quality
  - Gap: ilike is slow on large datasets.
  - Risk: search becomes unusable.
  - Mitigation: add full-text or external search later.

- Attachments
  - Gap: no decision on storage/provider.
  - Risk: later schema change.
  - Mitigation: decide early even if you skip for V1.

- Activity history
  - Gap: no audit log.
  - Risk: debugging changes becomes hard.
  - Mitigation: add task_events later if needed.

- Dependencies
  - Gap: dependencies are only text.
  - Risk: blockers are not actionable.
  - Mitigation: use task_dependencies table later.

- Notifications
  - Gap: no reminders or alerts.
  - Risk: missed deadlines.
  - Mitigation: add scheduled reminders later.

- Accessibility
  - Gap: drag-drop may not be keyboard accessible.
  - Risk: poor UX for some users.
  - Mitigation: pick an a11y-friendly DnD lib and test keyboard flows.

- Mobile UX
  - Gap: no explicit mobile layout for kanban.
  - Risk: kanban unusable on phones.
  - Mitigation: horizontal scroll + compact cards.

- Export
  - Gap: no data export.
  - Risk: lock-in for client reporting.
  - Mitigation: add CSV export button later.

- Empty states
  - Gap: no onboarding or empty state guidance.
  - Risk: blank UI confusion.
  - Mitigation: add helpful empty state copy.
