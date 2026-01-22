-- ============================================================
-- STAGE 1: Lead to Project Conversion
-- Run this script in Supabase Dashboard SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Add conversion columns to leads table
-- ============================================================

DO $$
BEGIN
  -- Add client_id reference
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'client_id') THEN
    ALTER TABLE leads ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added client_id to leads';
  END IF;

  -- Add project_id reference
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'project_id') THEN
    ALTER TABLE leads ADD COLUMN project_id UUID REFERENCES agency_projects(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added project_id to leads';
  END IF;

  -- Add converted_at timestamp
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'converted_at') THEN
    ALTER TABLE leads ADD COLUMN converted_at TIMESTAMPTZ;
    RAISE NOTICE 'Added converted_at to leads';
  END IF;

  -- Add archived_at timestamp
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'archived_at') THEN
    ALTER TABLE leads ADD COLUMN archived_at TIMESTAMPTZ;
    RAISE NOTICE 'Added archived_at to leads';
  END IF;

  -- Add archived_by reference
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'archived_by') THEN
    ALTER TABLE leads ADD COLUMN archived_by UUID REFERENCES employees(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added archived_by to leads';
  END IF;
END $$;

-- Create index for archived_at queries
CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON leads(archived_at);

-- ============================================================
-- PART 2: Create client_users table (for portal access)
-- ============================================================

CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up users by client
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);

-- ============================================================
-- PART 3: Create client_portal_tokens table
-- ============================================================

CREATE TABLE IF NOT EXISTS client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_token ON client_portal_tokens(token);

-- Index for finding active tokens by user
CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_user_active ON client_portal_tokens(client_user_id) WHERE revoked_at IS NULL;

-- ============================================================
-- PART 4: RLS Policies for new tables
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;

-- client_users policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view client_users" ON client_users;
CREATE POLICY "Employees can view client_users" ON client_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert client_users" ON client_users;
CREATE POLICY "Employees can insert client_users" ON client_users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update client_users" ON client_users;
CREATE POLICY "Employees can update client_users" ON client_users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can delete client_users" ON client_users;
CREATE POLICY "Employees can delete client_users" ON client_users
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- client_portal_tokens policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view client_portal_tokens" ON client_portal_tokens;
CREATE POLICY "Employees can view client_portal_tokens" ON client_portal_tokens
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert client_portal_tokens" ON client_portal_tokens;
CREATE POLICY "Employees can insert client_portal_tokens" ON client_portal_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update client_portal_tokens" ON client_portal_tokens;
CREATE POLICY "Employees can update client_portal_tokens" ON client_portal_tokens
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can delete client_portal_tokens" ON client_portal_tokens;
CREATE POLICY "Employees can delete client_portal_tokens" ON client_portal_tokens
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- ============================================================
-- DONE
-- ============================================================
RAISE NOTICE 'Stage 1 migration complete: Lead to Project Conversion';
