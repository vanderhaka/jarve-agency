-- Migration: Add type column to tasks table if missing
-- Created: 2026-01-21

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN type text NOT NULL DEFAULT 'feature';

    ALTER TABLE tasks ADD CONSTRAINT tasks_type_check
      CHECK (type IN ('feature', 'bug', 'chore', 'spike'));
  END IF;
END $$;
