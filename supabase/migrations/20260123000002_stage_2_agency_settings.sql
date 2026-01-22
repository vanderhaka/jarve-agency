-- ============================================================
-- STAGE 2: Platform Foundations (Agency Settings)
-- Run this script in Supabase Dashboard SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Create agency_settings table (single-row pattern)
-- ============================================================

CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton BOOLEAN NOT NULL DEFAULT true,
  legal_name TEXT,
  trade_name TEXT,
  abn TEXT,
  gst_rate NUMERIC NOT NULL DEFAULT 0.10,
  default_currency TEXT NOT NULL DEFAULT 'AUD',
  timezone TEXT NOT NULL DEFAULT 'Australia/Adelaide',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  invoice_terms TEXT,
  invoice_terms_days INT,
  default_deposit_percent NUMERIC NOT NULL DEFAULT 0.50,
  timesheet_lock_weekday INT, -- 0=Sun .. 6=Sat
  timesheet_lock_time TIME,
  reminder_frequency TEXT NOT NULL DEFAULT 'daily',
  reminder_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce single-row pattern with unique constraint on singleton
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_settings_singleton ON agency_settings(singleton);

-- ============================================================
-- PART 2: Add deposit_percent override to agency_projects
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'deposit_percent') THEN
    ALTER TABLE agency_projects ADD COLUMN deposit_percent NUMERIC;
    RAISE NOTICE 'Added deposit_percent to agency_projects';
  END IF;
END $$;

-- ============================================================
-- PART 3: Create trigger to auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_agency_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agency_settings_updated_at ON agency_settings;
CREATE TRIGGER trigger_agency_settings_updated_at
  BEFORE UPDATE ON agency_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_settings_updated_at();

-- ============================================================
-- PART 4: RLS Policies for agency_settings
-- ============================================================

ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated employees can view settings
DROP POLICY IF EXISTS "Employees can view agency_settings" ON agency_settings;
CREATE POLICY "Employees can view agency_settings" ON agency_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Only admins can insert/update settings
DROP POLICY IF EXISTS "Admins can insert agency_settings" ON agency_settings;
CREATE POLICY "Admins can insert agency_settings" ON agency_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
      AND employees.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update agency_settings" ON agency_settings;
CREATE POLICY "Admins can update agency_settings" ON agency_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_id = auth.uid()
      AND employees.deleted_at IS NULL
      AND employees.role = 'admin'
    )
  );

-- ============================================================
-- PART 5: Insert default settings row if none exists
-- ============================================================

INSERT INTO agency_settings (singleton)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM agency_settings);

-- ============================================================
-- DONE
-- ============================================================
RAISE NOTICE 'Stage 2 migration complete: Agency Settings';
