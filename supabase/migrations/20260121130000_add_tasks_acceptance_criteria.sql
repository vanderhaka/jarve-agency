-- Add acceptance_criteria and blockers columns to tasks table
-- These columns were defined in the original schema but may not exist in the database

DO $$
BEGIN
  -- Add acceptance_criteria if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'acceptance_criteria'
  ) THEN
    ALTER TABLE tasks ADD COLUMN acceptance_criteria text;
  END IF;

  -- Add blockers if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'blockers'
  ) THEN
    ALTER TABLE tasks ADD COLUMN blockers text;
  END IF;
END $$;
