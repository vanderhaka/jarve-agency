-- Migration: Create tasks table with indexes and RLS
-- Created: 2026-01-21
-- Combined migration for project task management

-- ============================================
-- 1. CREATE TASKS TABLE
-- ============================================

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Backlog',
  type text NOT NULL DEFAULT 'feature',
  priority text NOT NULL DEFAULT 'medium',
  position numeric NOT NULL DEFAULT 0,
  estimate numeric,
  due_date date,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acceptance_criteria text,
  blockers text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Check constraints for valid values
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('Backlog', 'Ready', 'In Progress', 'Review', 'QA', 'Done', 'Blocked'));

ALTER TABLE tasks ADD CONSTRAINT tasks_type_check
  CHECK (type IN ('feature', 'bug', 'chore', 'spike'));

ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX idx_tasks_project_status_position ON tasks (project_id, status, position);
CREATE INDEX idx_tasks_project_due_date ON tasks (project_id, due_date);
CREATE INDEX idx_tasks_project_priority ON tasks (project_id, priority);
CREATE INDEX idx_tasks_assignee ON tasks (assignee_id) WHERE assignee_id IS NOT NULL;

-- ============================================
-- 3. ROW LEVEL SECURITY (Single-Admin Model)
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all tasks"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE TO authenticated USING (true);

-- ============================================
-- 4. METADATA
-- ============================================

COMMENT ON TABLE tasks IS 'Project tasks for kanban/list views';
