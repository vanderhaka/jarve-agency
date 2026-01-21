-- Migration: Ensure assignee_id column exists on tasks table
-- Created: 2026-01-21

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id) WHERE assignee_id IS NOT NULL;
  END IF;
END $$;
