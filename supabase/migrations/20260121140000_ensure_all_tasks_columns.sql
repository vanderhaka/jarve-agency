-- Ensure ALL task columns exist
-- This migration adds any missing columns to bring the tasks table to full schema

DO $$
BEGIN
  -- Core columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'description') THEN
    ALTER TABLE tasks ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'type') THEN
    ALTER TABLE tasks ADD COLUMN type text NOT NULL DEFAULT 'feature';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
    ALTER TABLE tasks ADD COLUMN priority text NOT NULL DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'position') THEN
    ALTER TABLE tasks ADD COLUMN position numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'estimate') THEN
    ALTER TABLE tasks ADD COLUMN estimate numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
    ALTER TABLE tasks ADD COLUMN due_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assignee_id') THEN
    ALTER TABLE tasks ADD COLUMN assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'acceptance_criteria') THEN
    ALTER TABLE tasks ADD COLUMN acceptance_criteria text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'blockers') THEN
    ALTER TABLE tasks ADD COLUMN blockers text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_at') THEN
    ALTER TABLE tasks ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
    ALTER TABLE tasks ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Add check constraints if they don't exist (safe to rerun)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_type_check') THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_type_check
      CHECK (type IN ('feature', 'bug', 'chore', 'spike'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_priority_check') THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tasks_project_status_position ON tasks (project_id, status, position);
CREATE INDEX IF NOT EXISTS idx_tasks_project_due_date ON tasks (project_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_priority ON tasks (project_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id) WHERE assignee_id IS NOT NULL;
