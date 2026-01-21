-- Add foreign key from tasks.assignee_id to employees.id for Supabase joins
-- This allows the select query to use the relationship syntax

-- First, drop the existing constraint to auth.users if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_assignee_id_fkey'
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_assignee_id_fkey;
  END IF;
END $$;

-- Add foreign key to employees table
-- employees.id references auth.users(id), so this is transitive
ALTER TABLE tasks
  ADD CONSTRAINT tasks_assignee_id_fkey
  FOREIGN KEY (assignee_id)
  REFERENCES employees(id)
  ON DELETE SET NULL;
