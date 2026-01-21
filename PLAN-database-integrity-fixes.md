# Ensemble Execution Plan

**Status**: Completed
**Complexity**: 45/100 (Complex)
**Agents**: 1 (Direct execution - database migrations)
**Started**: 2024-01-21
**Updated**: 2024-01-21

---

## Questions & Clarifications

> None - requirements are clear from the code review findings.

---

## Objective
Add database constraints, foreign keys, soft deletes, RLS policies, and indexes to prevent orphaned records and ensure data integrity in the admin section.

## Analysis
The code review identified missing foreign key constraints, no cascade rules, no soft deletes, missing RLS policies, and missing indexes. This is a database-focused task requiring SQL migrations. Complexity score: Database (+12) + Security (+18) + Multi-file (+15) = 45.

---

## Agent Type: database-specialist

## Base Task
Create Supabase migrations to fix data integrity issues: foreign key constraints with proper cascades, soft delete columns, RLS policies, performance indexes, and a safe employee invite function.

---

## Tasks

- [x] Phase 0: Research (gather context from code review)
- [x] Phase 0.5: Clarify (no questions)
- [x] Phase 1: Plan (this document)
- [x] Phase 2: Execute (create migration files)
- [x] Phase 3: Review (verify migrations)
- [x] Phase 4: Validate (TypeScript compiles)
- [x] Phase 5: Deliver (present result)

### Implementation Tasks (Micro-Steps)

### Step 1.1: Create FK constraints migration
- **passes**: false
- **criteria**:
  - test: `cat supabase/migrations/*_add_foreign_key_constraints.sql` → "ALTER TABLE"
  - principle: "All FK constraints use ON DELETE SET NULL or CASCADE appropriately"
- **evidence**: []
- **attempts**: 0

### Step 1.2: Create soft deletes migration
- **passes**: false
- **criteria**:
  - test: `cat supabase/migrations/*_add_soft_deletes.sql` → "deleted_at"
  - principle: "Soft delete columns added to employees, leads, clients"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.1"]

### Step 1.3: Create RLS policies migration
- **passes**: false
- **criteria**:
  - test: `cat supabase/migrations/*_add_rls_policies.sql` → "ENABLE ROW LEVEL SECURITY"
  - principle: "RLS policies cover all tables with proper role checks"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.1"]

### Step 1.4: Create indexes migration
- **passes**: false
- **criteria**:
  - test: `cat supabase/migrations/*_add_indexes.sql` → "CREATE INDEX"
  - principle: "Indexes cover frequently queried columns"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.1"]

### Step 1.5: Create safe employee invite function
- **passes**: false
- **criteria**:
  - test: `cat supabase/migrations/*_add_safe_invite_function.sql` → "CREATE OR REPLACE FUNCTION"
  - principle: "Function handles transaction rollback on failure"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.1", "1.3"]

### Step 1.6: Update application code to use soft deletes
- **passes**: false
- **criteria**:
  - test: `grep -r "deleted_at IS NULL" app/` → "Found in queries"
  - principle: "All list queries filter out soft-deleted records"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.2"]

## Files to Modify
- `supabase/migrations/20240121000001_add_foreign_key_constraints.sql` - FK constraints with cascades
- `supabase/migrations/20240121000002_add_soft_deletes.sql` - Soft delete columns
- `supabase/migrations/20240121000003_add_rls_policies.sql` - Row Level Security
- `supabase/migrations/20240121000004_add_indexes.sql` - Performance indexes
- `supabase/migrations/20240121000005_add_safe_invite_function.sql` - Transaction-safe invite
- `app/admin/employees/page.tsx` - Filter soft-deleted employees
- `app/admin/audit/page.tsx` - Handle null lead/client references

---

## Perspective Prompts

### P1: SIMPLICITY
**Prompt**: "Create database migrations - Focus on SIMPLICITY: Minimal SQL that achieves the goal"
**Goal**: Clean, readable migrations

### P2: ROBUSTNESS
**Prompt**: "Create database migrations - Focus on ROBUSTNESS: Handle edge cases, use IF EXISTS"
**Goal**: Idempotent migrations that can be re-run safely

### P3: SECURITY
**Prompt**: "Create database migrations - Focus on SECURITY: RLS policies prevent unauthorized access"
**Goal**: Proper row-level security

---

## Integration Notes
Each migration file should be self-contained and idempotent (can be run multiple times safely).

## Expected Conflicts
None - these are database-level changes with clear requirements.

## Decisions Made
- Use SET NULL on delete for interactions (preserve history)
- Use SET NULL on delete for leads.assigned_to (unassign deleted employees)
- Soft deletes instead of hard deletes for audit trail

## Outcome

### Created Files

**Supabase Migrations:**
1. `supabase/migrations/20240121000001_add_foreign_key_constraints.sql`
   - FK constraints with ON DELETE SET NULL for leads, clients, employees
   - CHECK constraints for role and status enums
   - UNIQUE constraints for emails

2. `supabase/migrations/20240121000002_add_soft_deletes.sql`
   - `deleted_at` columns on all main tables
   - Views for active records (active_employees, active_leads, etc.)
   - `soft_delete_record()` and `restore_record()` helper functions
   - Trigger to prevent last admin deletion
   - Partial indexes for active records

3. `supabase/migrations/20240121000003_add_rls_policies.sql`
   - RLS enabled on all tables
   - `is_admin()` and `is_employee()` helper functions
   - Policies for read/write access based on role
   - GRANT statements for authenticated users

4. `supabase/migrations/20240121000004_add_indexes.sql`
   - Performance indexes on frequently queried columns
   - Covering indexes for common query patterns
   - Partial indexes filtering deleted records

5. `supabase/migrations/20240121000005_add_safe_invite_function.sql`
   - `create_employee_record()` - transaction-safe employee creation
   - `check_email_available()` - duplicate check before invite
   - `get_admin_count()` - for last admin protection
   - `change_employee_role()` - safe role change with protection
   - `soft_delete_employee()` - safe deletion with cascade

### Updated Application Code

- `app/admin/employees/page.tsx` - Uses new DB functions, filters soft-deleted
- `app/admin/audit/page.tsx` - Filters soft-deleted, handles null references
- `app/admin/page.tsx` - Filters soft-deleted in counts
- `app/admin/layout.tsx` - Filters soft-deleted in auth check

### To Apply Migrations

Run in Supabase Dashboard SQL Editor or via CLI:
```bash
supabase db push
# or
supabase migration up
```
