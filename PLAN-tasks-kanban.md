# Ensemble Execution Plan

**Status**: Executing
**Complexity**: 65/100 (Medium-High)
**Agents**: 3 (backend-developer, nextjs-developer, database-specialist)
**Started**: 2026-01-21
**Updated**: 2026-01-21

---

## Questions & Clarifications

None - all decisions approved by owner in planning steps 0-5.

---

## Objective

Implement a Projects + Tasks system with List and Kanban views for the agency CRM.

---

## Agent Type: backend-developer

PRIMARY: backend-developer (database schema, data access layer)
SECONDARY: nextjs-developer (routes, UI components)

---

## Tasks

### Phase 1: Database Schema (Steps 5-9)

#### Step 5.1: Create tasks table migration
- **passes**: false
- **criteria**:
  - test: `ls supabase/migrations/*create_tasks*.sql` → "file exists"
- **evidence**: []

#### Step 6.1: Document ordering strategy
- **passes**: false
- **criteria**:
  - principle: "Fractional positioning documented in plan"
- **evidence**: []

#### Step 7.1: Add indexes migration
- **passes**: false
- **criteria**:
  - test: `grep -l "CREATE INDEX" supabase/migrations/*tasks*.sql` → "file found"
- **evidence**: []

#### Step 8.1: Add RLS policies migration
- **passes**: false
- **criteria**:
  - test: `grep -l "CREATE POLICY" supabase/migrations/*tasks*.sql` → "file found"
- **evidence**: []

#### Step 9.1: Apply migrations to Supabase
- **passes**: false
- **criteria**:
  - principle: "Migrations applied successfully, tables visible in Supabase"
- **evidence**: []

### Phase 2: Type Definitions & Data Access (Steps 10-11)

#### Step 10.1: Create TypeScript types for tasks
- **passes**: false
- **criteria**:
  - type: `npx tsc --noEmit` → "No errors"
- **evidence**: []

#### Step 11.1: Create data access functions
- **passes**: false
- **criteria**:
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "CRUD functions implemented: getTasksByProject, createTask, updateTask, deleteTask, moveTask"
- **evidence**: []

### Phase 3: Routes & UI (Steps 12-18)

#### Step 12.1: Create project detail route
- **passes**: false
- **criteria**:
  - test: `ls app/app/projects/\\[id\\]/page.tsx` → "file exists"
- **evidence**: []

#### Step 13.1: Build project detail shell with view toggle
- **passes**: false
- **criteria**:
  - principle: "Header with project info, List/Kanban tabs render"
- **evidence**: []

#### Step 14.1: Implement list view
- **passes**: false
- **criteria**:
  - principle: "Table with sortable columns renders tasks"
- **evidence**: []

#### Step 15.1: Implement task creation modal
- **passes**: false
- **criteria**:
  - principle: "New task modal creates task in DB"
- **evidence**: []

#### Step 16.1: Implement task detail editor
- **passes**: false
- **criteria**:
  - principle: "Task drawer allows editing all fields"
- **evidence**: []

#### Step 17.1: Implement kanban columns
- **passes**: false
- **criteria**:
  - principle: "All status columns render with task cards"
- **evidence**: []

#### Step 18.1: Implement drag-and-drop
- **passes**: false
- **criteria**:
  - principle: "Tasks can be dragged between columns, order persists"
- **evidence**: []

### Phase 4: Polish (Steps 19-22)

#### Step 19.1: Add filters and search
- **passes**: false
- **criteria**:
  - principle: "Filter by status/type/priority works"
- **evidence**: []

#### Step 20.1: Add project summary panel
- **passes**: false
- **criteria**:
  - principle: "Summary shows task counts by status"
- **evidence**: []

#### Step 21.1: Add error handling and UX safeguards
- **passes**: false
- **criteria**:
  - principle: "Delete confirmation, error toasts, loading states"
- **evidence**: []

#### Step 22.1: QA testing
- **passes**: false
- **criteria**:
  - principle: "Manual QA checklist passed"
- **evidence**: []

---

## Files to Modify

### New Files
- `supabase/migrations/20260121100000_create_tasks_table.sql`
- `supabase/migrations/20260121100001_add_tasks_indexes.sql`
- `supabase/migrations/20260121100002_add_tasks_rls.sql`
- `lib/tasks/types.ts`
- `lib/tasks/data.ts`
- `app/app/projects/[id]/page.tsx`
- `components/tasks/task-list.tsx`
- `components/tasks/task-kanban.tsx`
- `components/tasks/task-card.tsx`
- `components/tasks/task-form.tsx`
- `components/tasks/task-drawer.tsx`

### Modified Files
- `app/app/projects/page.tsx` - Add link to project detail

---

## Ordering Strategy (Step 6)

**Fractional Positioning:**
- `position` column uses `numeric` type for decimal precision
- When inserting between tasks A (pos=1.0) and B (pos=2.0): new position = 1.5
- When inserting at start: new position = first_position - 1
- When inserting at end: new position = last_position + 1
- Reindex when positions get too granular (e.g., 10+ decimal places)

**Example:**
```
Initial: [Task1: 1.0] [Task2: 2.0] [Task3: 3.0]
Move Task3 between 1 and 2: [Task1: 1.0] [Task3: 1.5] [Task2: 2.0]
```
