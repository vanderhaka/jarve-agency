-- ============================================================
-- STAGE 5: Xero Integration (Invoices + Payments)
-- Run this script in Supabase Dashboard SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Create xero_connections table (OAuth tokens + tenant)
-- ============================================================

CREATE TABLE IF NOT EXISTS xero_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  tenant_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one active connection at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_xero_connections_active
  ON xero_connections(is_active) WHERE is_active = true;

-- ============================================================
-- PART 2: Add xero_contact_id to clients table
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'xero_contact_id') THEN
    ALTER TABLE clients ADD COLUMN xero_contact_id TEXT;
    RAISE NOTICE 'Added xero_contact_id to clients';
  END IF;
END $$;

-- Index for Xero contact lookups
CREATE INDEX IF NOT EXISTS idx_clients_xero_contact_id ON clients(xero_contact_id) WHERE xero_contact_id IS NOT NULL;

-- ============================================================
-- PART 3: Create invoices table
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES agency_projects(id) ON DELETE SET NULL,
  xero_invoice_id TEXT,
  xero_status TEXT, -- DRAFT, SUBMITTED, AUTHORISED, PAID, VOIDED, DELETED
  invoice_number TEXT,
  currency TEXT NOT NULL DEFAULT 'AUD',
  subtotal NUMERIC,
  gst_rate NUMERIC NOT NULL DEFAULT 0.10,
  gst_amount NUMERIC,
  total NUMERIC,
  issue_date DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  payment_link_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_xero_invoice_id ON invoices(xero_invoice_id) WHERE xero_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_xero_status ON invoices(xero_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_invoice_number_unique ON invoices(invoice_number) WHERE invoice_number IS NOT NULL;

-- ============================================================
-- PART 4: Create invoice_line_items table
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  xero_account_code TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for line items by invoice
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- ============================================================
-- PART 5: Create payments table
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  method TEXT, -- stripe, bank_transfer, cash, other
  reference TEXT,
  stripe_payment_intent_id TEXT,
  xero_payment_id TEXT,
  recorded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================
-- PART 6: Create contract_docs table (stub for Stage 3)
-- Note: This is a minimal version; Stage 3 will extend it
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
  source_table TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for contract_docs lookups
CREATE INDEX IF NOT EXISTS idx_contract_docs_client_id ON contract_docs(client_id);
CREATE INDEX IF NOT EXISTS idx_contract_docs_project_id ON contract_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_docs_doc_type ON contract_docs(doc_type);
CREATE INDEX IF NOT EXISTS idx_contract_docs_source ON contract_docs(source_table, source_id);

-- ============================================================
-- PART 7: Triggers for updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_xero_connections_updated_at ON xero_connections;
CREATE TRIGGER trigger_xero_connections_updated_at
  BEFORE UPDATE ON xero_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices;
CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 8: RLS Policies
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE xero_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_docs ENABLE ROW LEVEL SECURITY;

-- xero_connections: Employees can view, only admins can modify
DROP POLICY IF EXISTS "Employees can view xero_connections" ON xero_connections;
CREATE POLICY "Employees can view xero_connections" ON xero_connections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Admins can manage xero_connections" ON xero_connections;
CREATE POLICY "Admins can manage xero_connections" ON xero_connections
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
      AND employees.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
      AND employees.role = 'admin'
    )
  );

-- invoices: Employees can CRUD
DROP POLICY IF EXISTS "Employees can view invoices" ON invoices;
CREATE POLICY "Employees can view invoices" ON invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert invoices" ON invoices;
CREATE POLICY "Employees can insert invoices" ON invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update invoices" ON invoices;
CREATE POLICY "Employees can update invoices" ON invoices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can delete invoices" ON invoices;
CREATE POLICY "Employees can delete invoices" ON invoices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- invoice_line_items: Employees can CRUD
DROP POLICY IF EXISTS "Employees can view invoice_line_items" ON invoice_line_items;
CREATE POLICY "Employees can view invoice_line_items" ON invoice_line_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert invoice_line_items" ON invoice_line_items;
CREATE POLICY "Employees can insert invoice_line_items" ON invoice_line_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update invoice_line_items" ON invoice_line_items;
CREATE POLICY "Employees can update invoice_line_items" ON invoice_line_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can delete invoice_line_items" ON invoice_line_items;
CREATE POLICY "Employees can delete invoice_line_items" ON invoice_line_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- payments: Employees can CRUD
DROP POLICY IF EXISTS "Employees can view payments" ON payments;
CREATE POLICY "Employees can view payments" ON payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert payments" ON payments;
CREATE POLICY "Employees can insert payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update payments" ON payments;
CREATE POLICY "Employees can update payments" ON payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can delete payments" ON payments;
CREATE POLICY "Employees can delete payments" ON payments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- contract_docs: Employees can CRUD
DROP POLICY IF EXISTS "Employees can view contract_docs" ON contract_docs;
CREATE POLICY "Employees can view contract_docs" ON contract_docs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can insert contract_docs" ON contract_docs;
CREATE POLICY "Employees can insert contract_docs" ON contract_docs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can update contract_docs" ON contract_docs;
CREATE POLICY "Employees can update contract_docs" ON contract_docs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Employees can delete contract_docs" ON contract_docs;
CREATE POLICY "Employees can delete contract_docs" ON contract_docs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- ============================================================
-- DONE
-- ============================================================
RAISE NOTICE 'Stage 5 migration complete: Xero Integration (Invoices + Payments)';
