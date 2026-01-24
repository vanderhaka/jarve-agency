-- ============================================================
-- STAGE 6: Milestones + Change Requests
-- Run this script in Supabase Dashboard SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Create milestones table
-- ============================================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC NOT NULL DEFAULT 0.10,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'planned', -- planned, active, complete, invoiced
  sort_order INT NOT NULL DEFAULT 0,
  is_deposit BOOLEAN NOT NULL DEFAULT false,
  invoice_id UUID, -- FK to invoices table will be added in Stage 5
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project_sort ON milestones(project_id, sort_order);

-- Updated_at trigger for milestones
CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS milestones_updated_at ON milestones;
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestones_updated_at();

-- ============================================================
-- PART 2: Create change_requests table
-- ============================================================

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  gst_rate NUMERIC NOT NULL DEFAULT 0.10,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, signed, rejected, archived
  -- Rejection tracking
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Signature tracking
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_email TEXT,
  signature_svg TEXT,
  ip_address TEXT,
  -- Portal token for signing
  portal_token TEXT UNIQUE,
  portal_token_expires_at TIMESTAMPTZ,
  -- Linked milestone (created after signing)
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for change_requests
CREATE INDEX IF NOT EXISTS idx_change_requests_project_id ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_portal_token ON change_requests(portal_token) WHERE portal_token IS NOT NULL;

-- Updated_at trigger for change_requests
CREATE OR REPLACE FUNCTION update_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS change_requests_updated_at ON change_requests;
CREATE TRIGGER change_requests_updated_at
  BEFORE UPDATE ON change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_change_requests_updated_at();

-- ============================================================
-- PART 3: RLS Policies for milestones
-- ============================================================

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Employees can view milestones
DROP POLICY IF EXISTS "Employees can view milestones" ON milestones;
CREATE POLICY "Employees can view milestones" ON milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can insert milestones
DROP POLICY IF EXISTS "Employees can insert milestones" ON milestones;
CREATE POLICY "Employees can insert milestones" ON milestones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can update milestones
DROP POLICY IF EXISTS "Employees can update milestones" ON milestones;
CREATE POLICY "Employees can update milestones" ON milestones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can delete milestones
DROP POLICY IF EXISTS "Employees can delete milestones" ON milestones;
CREATE POLICY "Employees can delete milestones" ON milestones
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- ============================================================
-- PART 4: RLS Policies for change_requests
-- ============================================================

ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- Employees can view change_requests
DROP POLICY IF EXISTS "Employees can view change_requests" ON change_requests;
CREATE POLICY "Employees can view change_requests" ON change_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can insert change_requests
DROP POLICY IF EXISTS "Employees can insert change_requests" ON change_requests;
CREATE POLICY "Employees can insert change_requests" ON change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can update change_requests
DROP POLICY IF EXISTS "Employees can update change_requests" ON change_requests;
CREATE POLICY "Employees can update change_requests" ON change_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Employees can delete change_requests
DROP POLICY IF EXISTS "Employees can delete change_requests" ON change_requests;
CREATE POLICY "Employees can delete change_requests" ON change_requests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- ============================================================
-- PART 5: Anonymous access for change request signing (portal)
-- ============================================================

-- Anonymous users can view change requests by portal token (for signing)
DROP POLICY IF EXISTS "Anonymous can view change_requests by token" ON change_requests;
CREATE POLICY "Anonymous can view change_requests by token" ON change_requests
  FOR SELECT TO anon
  USING (
    portal_token IS NOT NULL
    AND portal_token_expires_at > now()
    AND status = 'sent'
  );

-- Anonymous users can update change requests to sign them
DROP POLICY IF EXISTS "Anonymous can sign change_requests" ON change_requests;
CREATE POLICY "Anonymous can sign change_requests" ON change_requests
  FOR UPDATE TO anon
  USING (
    portal_token IS NOT NULL
    AND portal_token_expires_at > now()
    AND status = 'sent'
  )
  WITH CHECK (
    -- Can only change these fields when signing
    status IN ('signed', 'rejected')
  );

-- ============================================================
-- DONE
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Stage 6 migration complete: Milestones + Change Requests'; END $$;
