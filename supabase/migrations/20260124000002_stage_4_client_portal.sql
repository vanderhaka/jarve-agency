-- ============================================================
-- STAGE 4: Client Portal (Chat + Uploads + Docs Vault)
-- ============================================================

-- ============================================================
-- PART 1: Create portal_messages table
-- ============================================================

CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('owner', 'client')),
  author_id UUID,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching messages by project
CREATE INDEX IF NOT EXISTS idx_portal_messages_project_id ON portal_messages(project_id);

-- Index for ordering by created_at
CREATE INDEX IF NOT EXISTS idx_portal_messages_created_at ON portal_messages(created_at);

-- ============================================================
-- PART 2: Create client_uploads table
-- ============================================================

CREATE TABLE IF NOT EXISTS client_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('owner', 'client')),
  uploaded_by_id UUID,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching uploads by project
CREATE INDEX IF NOT EXISTS idx_client_uploads_project_id ON client_uploads(project_id);

-- ============================================================
-- PART 3: Create portal_read_state table
-- ============================================================

CREATE TABLE IF NOT EXISTS portal_read_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'client')),
  user_id UUID,
  last_read_at TIMESTAMPTZ,
  UNIQUE(project_id, user_type, user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_portal_read_state_project_user ON portal_read_state(project_id, user_type, user_id);

-- ============================================================
-- PART 4: RLS Policies
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_read_state ENABLE ROW LEVEL SECURITY;

-- portal_messages policies
-- Employees can view all messages
DROP POLICY IF EXISTS "Employees can view portal_messages" ON portal_messages;
CREATE POLICY "Employees can view portal_messages" ON portal_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can insert messages (as owner)
DROP POLICY IF EXISTS "Employees can insert portal_messages" ON portal_messages;
CREATE POLICY "Employees can insert portal_messages" ON portal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can delete messages
DROP POLICY IF EXISTS "Employees can delete portal_messages" ON portal_messages;
CREATE POLICY "Employees can delete portal_messages" ON portal_messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Anonymous users can view messages for their project (via token validation in app)
DROP POLICY IF EXISTS "Anon can view portal_messages" ON portal_messages;
CREATE POLICY "Anon can view portal_messages" ON portal_messages
  FOR SELECT TO anon
  USING (true);

-- Anonymous users can insert messages (client messages via portal)
DROP POLICY IF EXISTS "Anon can insert portal_messages" ON portal_messages;
CREATE POLICY "Anon can insert portal_messages" ON portal_messages
  FOR INSERT TO anon
  WITH CHECK (true);

-- client_uploads policies
-- Employees can view all uploads
DROP POLICY IF EXISTS "Employees can view client_uploads" ON client_uploads;
CREATE POLICY "Employees can view client_uploads" ON client_uploads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can insert uploads
DROP POLICY IF EXISTS "Employees can insert client_uploads" ON client_uploads;
CREATE POLICY "Employees can insert client_uploads" ON client_uploads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can delete uploads
DROP POLICY IF EXISTS "Employees can delete client_uploads" ON client_uploads;
CREATE POLICY "Employees can delete client_uploads" ON client_uploads
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Anonymous users can view uploads for their project
DROP POLICY IF EXISTS "Anon can view client_uploads" ON client_uploads;
CREATE POLICY "Anon can view client_uploads" ON client_uploads
  FOR SELECT TO anon
  USING (true);

-- Anonymous users can insert uploads
DROP POLICY IF EXISTS "Anon can insert client_uploads" ON client_uploads;
CREATE POLICY "Anon can insert client_uploads" ON client_uploads
  FOR INSERT TO anon
  WITH CHECK (true);

-- portal_read_state policies
-- Employees can view/manage read state
DROP POLICY IF EXISTS "Employees can view portal_read_state" ON portal_read_state;
CREATE POLICY "Employees can view portal_read_state" ON portal_read_state
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert portal_read_state" ON portal_read_state;
CREATE POLICY "Employees can insert portal_read_state" ON portal_read_state
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update portal_read_state" ON portal_read_state;
CREATE POLICY "Employees can update portal_read_state" ON portal_read_state
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Anonymous users can manage their own read state
DROP POLICY IF EXISTS "Anon can view portal_read_state" ON portal_read_state;
CREATE POLICY "Anon can view portal_read_state" ON portal_read_state
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can insert portal_read_state" ON portal_read_state;
CREATE POLICY "Anon can insert portal_read_state" ON portal_read_state
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update portal_read_state" ON portal_read_state;
CREATE POLICY "Anon can update portal_read_state" ON portal_read_state
  FOR UPDATE TO anon
  USING (true);

-- ============================================================
-- PART 5: Storage buckets (via SQL - needs manual setup in dashboard too)
-- Note: Storage bucket creation is typically done via dashboard or CLI
-- These commands document the expected bucket configuration
-- ============================================================

-- Storage buckets to create:
-- 1. contract-docs - for contracts, invoices, signed documents (from Stage 3/5)
-- 2. client-uploads - for client uploaded files

-- Storage policies will be configured via dashboard:
-- - contract-docs: authenticated users can read/write, anon can read (with signed URL)
-- - client-uploads: authenticated users can read/write/delete, anon can read/write (with signed URL)

-- ============================================================
-- DONE
-- ============================================================
