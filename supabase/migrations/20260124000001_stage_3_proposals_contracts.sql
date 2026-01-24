-- ============================================================
-- STAGE 3: Proposals + Contracts (MSA/SOW)
-- Creates tables for proposal workflow and contract document storage
-- ============================================================

-- ============================================================
-- PART 1: Create proposal_templates table
-- ============================================================

CREATE TABLE IF NOT EXISTS proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]', -- array of section blocks
  default_terms TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_proposal_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposal_templates_updated_at ON proposal_templates;
CREATE TRIGGER trigger_proposal_templates_updated_at
  BEFORE UPDATE ON proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_templates_updated_at();

-- ============================================================
-- PART 2: Create proposals table
-- ============================================================

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES agency_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, signed, archived
  current_version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Indexes for proposals
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposals_updated_at ON proposals;
CREATE TRIGGER trigger_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposals_updated_at();

-- ============================================================
-- PART 3: Create proposal_versions table
-- ============================================================

CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content JSONB NOT NULL, -- sections, pricing, terms
  subtotal NUMERIC,
  gst_rate NUMERIC NOT NULL DEFAULT 0.10,
  gst_amount NUMERIC,
  total NUMERIC,
  pdf_path TEXT,
  sent_at TIMESTAMPTZ, -- when this version was sent to client
  sent_to_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one version number per proposal
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposal_versions_unique ON proposal_versions(proposal_id, version);

-- Index for finding versions by proposal
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON proposal_versions(proposal_id);

-- ============================================================
-- PART 4: Create proposal_signatures table
-- ============================================================

CREATE TABLE IF NOT EXISTS proposal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  proposal_version_id UUID REFERENCES proposal_versions(id) ON DELETE SET NULL,
  client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_svg TEXT NOT NULL,
  ip_address TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for finding signatures by proposal
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_proposal_id ON proposal_signatures(proposal_id);

-- ============================================================
-- PART 5: Create contract_docs table (vault)
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES agency_projects(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL, -- msa, sow, proposal_version, change_request, invoice
  title TEXT NOT NULL,
  version INT,
  file_path TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  source_table TEXT, -- e.g., 'proposals', 'change_requests'
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for contract_docs
CREATE INDEX IF NOT EXISTS idx_contract_docs_client_id ON contract_docs(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_docs_project_id ON contract_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_docs_doc_type ON contract_docs(doc_type);
CREATE INDEX IF NOT EXISTS idx_contract_docs_source ON contract_docs(source_table, source_id);

-- ============================================================
-- PART 6: Create client_msas table (one MSA per client)
-- ============================================================

CREATE TABLE IF NOT EXISTS client_msas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Master Service Agreement',
  content JSONB, -- MSA terms and conditions
  pdf_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, signed
  sent_at TIMESTAMPTZ,
  sent_to_client_user_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_email TEXT,
  signature_svg TEXT,
  ip_address TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one MSA per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_msas_client_unique ON client_msas(client_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_client_msas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_client_msas_updated_at ON client_msas;
CREATE TRIGGER trigger_client_msas_updated_at
  BEFORE UPDATE ON client_msas
  FOR EACH ROW
  EXECUTE FUNCTION update_client_msas_updated_at();

-- ============================================================
-- PART 7: RLS Policies
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_msas ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is employee
CREATE OR REPLACE FUNCTION is_active_employee(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = user_id
    AND employees.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- proposal_templates policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view proposal_templates" ON proposal_templates;
CREATE POLICY "Employees can view proposal_templates" ON proposal_templates
  FOR SELECT TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can insert proposal_templates" ON proposal_templates;
CREATE POLICY "Employees can insert proposal_templates" ON proposal_templates
  FOR INSERT TO authenticated
  WITH CHECK (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can update proposal_templates" ON proposal_templates;
CREATE POLICY "Employees can update proposal_templates" ON proposal_templates
  FOR UPDATE TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can delete proposal_templates" ON proposal_templates;
CREATE POLICY "Employees can delete proposal_templates" ON proposal_templates
  FOR DELETE TO authenticated
  USING (is_active_employee(auth.uid()));

-- proposals policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view proposals" ON proposals;
CREATE POLICY "Employees can view proposals" ON proposals
  FOR SELECT TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can insert proposals" ON proposals;
CREATE POLICY "Employees can insert proposals" ON proposals
  FOR INSERT TO authenticated
  WITH CHECK (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can update proposals" ON proposals;
CREATE POLICY "Employees can update proposals" ON proposals
  FOR UPDATE TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can delete proposals" ON proposals;
CREATE POLICY "Employees can delete proposals" ON proposals
  FOR DELETE TO authenticated
  USING (is_active_employee(auth.uid()));

-- proposal_versions policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view proposal_versions" ON proposal_versions;
CREATE POLICY "Employees can view proposal_versions" ON proposal_versions
  FOR SELECT TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can insert proposal_versions" ON proposal_versions;
CREATE POLICY "Employees can insert proposal_versions" ON proposal_versions
  FOR INSERT TO authenticated
  WITH CHECK (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can update proposal_versions" ON proposal_versions;
CREATE POLICY "Employees can update proposal_versions" ON proposal_versions
  FOR UPDATE TO authenticated
  USING (is_active_employee(auth.uid()));

-- proposal_signatures policies (employees can view, insert via server action)
DROP POLICY IF EXISTS "Employees can view proposal_signatures" ON proposal_signatures;
CREATE POLICY "Employees can view proposal_signatures" ON proposal_signatures
  FOR SELECT TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can insert proposal_signatures" ON proposal_signatures;
CREATE POLICY "Employees can insert proposal_signatures" ON proposal_signatures
  FOR INSERT TO authenticated
  WITH CHECK (is_active_employee(auth.uid()));

-- Allow anonymous insert for client portal signing
DROP POLICY IF EXISTS "Anonymous can insert proposal_signatures" ON proposal_signatures;
CREATE POLICY "Anonymous can insert proposal_signatures" ON proposal_signatures
  FOR INSERT TO anon
  WITH CHECK (true);

-- contract_docs policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view contract_docs" ON contract_docs;
CREATE POLICY "Employees can view contract_docs" ON contract_docs
  FOR SELECT TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can insert contract_docs" ON contract_docs;
CREATE POLICY "Employees can insert contract_docs" ON contract_docs
  FOR INSERT TO authenticated
  WITH CHECK (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can update contract_docs" ON contract_docs;
CREATE POLICY "Employees can update contract_docs" ON contract_docs
  FOR UPDATE TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can delete contract_docs" ON contract_docs;
CREATE POLICY "Employees can delete contract_docs" ON contract_docs
  FOR DELETE TO authenticated
  USING (is_active_employee(auth.uid()));

-- client_msas policies (employees can CRUD)
DROP POLICY IF EXISTS "Employees can view client_msas" ON client_msas;
CREATE POLICY "Employees can view client_msas" ON client_msas
  FOR SELECT TO authenticated
  USING (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can insert client_msas" ON client_msas;
CREATE POLICY "Employees can insert client_msas" ON client_msas
  FOR INSERT TO authenticated
  WITH CHECK (is_active_employee(auth.uid()));

DROP POLICY IF EXISTS "Employees can update client_msas" ON client_msas;
CREATE POLICY "Employees can update client_msas" ON client_msas
  FOR UPDATE TO authenticated
  USING (is_active_employee(auth.uid()));

-- Allow anonymous update for client portal MSA signing
DROP POLICY IF EXISTS "Anonymous can update client_msas for signing" ON client_msas;
CREATE POLICY "Anonymous can update client_msas for signing" ON client_msas
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PART 8: Seed default proposal template
-- ============================================================

INSERT INTO proposal_templates (name, sections, default_terms, is_default)
SELECT
  'Standard Project Proposal',
  '[
    {"id": "intro", "type": "text", "title": "Introduction", "body": "Thank you for the opportunity to submit this proposal.", "order": 1},
    {"id": "scope", "type": "text", "title": "Scope of Work", "body": "", "order": 2},
    {"id": "deliverables", "type": "list", "title": "Deliverables", "items": [], "order": 3},
    {"id": "pricing", "type": "pricing", "title": "Investment", "order": 4},
    {"id": "timeline", "type": "text", "title": "Timeline", "body": "", "order": 5}
  ]'::jsonb,
  'Payment terms: 50% deposit required to commence work. Balance due upon completion. All prices are in AUD and exclusive of GST unless otherwise stated.',
  true
WHERE NOT EXISTS (SELECT 1 FROM proposal_templates WHERE is_default = true);

-- ============================================================
-- DONE
-- ============================================================
