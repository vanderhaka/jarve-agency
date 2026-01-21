-- Migration: Add Soft Delete Columns
-- Purpose: Enable soft deletes to preserve audit trail and prevent data loss
-- Date: 2024-01-21

-- ============================================================
-- 1. ADD SOFT DELETE COLUMNS
-- ============================================================

-- Employees soft delete
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Leads soft delete
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Clients soft delete
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Interactions soft delete (optional - for hiding specific interactions)
ALTER TABLE interactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================
-- 2. CREATE VIEWS FOR ACTIVE RECORDS
-- ============================================================

-- Active employees view (excludes soft-deleted)
CREATE OR REPLACE VIEW active_employees AS
  SELECT * FROM employees WHERE deleted_at IS NULL;

-- Active leads view
CREATE OR REPLACE VIEW active_leads AS
  SELECT * FROM leads WHERE deleted_at IS NULL;

-- Active clients view
CREATE OR REPLACE VIEW active_clients AS
  SELECT * FROM clients WHERE deleted_at IS NULL;

-- Active interactions view
CREATE OR REPLACE VIEW active_interactions AS
  SELECT * FROM interactions WHERE deleted_at IS NULL;

-- ============================================================
-- 3. CREATE SOFT DELETE HELPER FUNCTIONS
-- ============================================================

-- Generic soft delete function
CREATE OR REPLACE FUNCTION soft_delete_record(
  table_name TEXT,
  record_id UUID
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
    table_name
  ) USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore soft-deleted record
CREATE OR REPLACE FUNCTION restore_record(
  table_name TEXT,
  record_id UUID
)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET deleted_at = NULL WHERE id = $1',
    table_name
  ) USING record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. PREVENT LAST ADMIN DELETION
-- ============================================================

-- Function to check if this is the last admin
CREATE OR REPLACE FUNCTION check_last_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check when deleting or changing role away from admin
  IF (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin') OR
     (TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL AND OLD.role = 'admin') OR
     (TG_OP = 'DELETE' AND OLD.role = 'admin') THEN

    SELECT COUNT(*) INTO admin_count
    FROM employees
    WHERE role = 'admin'
      AND deleted_at IS NULL
      AND id != OLD.id;

    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last admin. At least one admin must exist.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last admin protection
DROP TRIGGER IF EXISTS prevent_last_admin_deletion ON employees;
CREATE TRIGGER prevent_last_admin_deletion
  BEFORE UPDATE OR DELETE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION check_last_admin();

-- ============================================================
-- 5. INDEXES FOR SOFT DELETE QUERIES
-- ============================================================

-- Partial indexes for active records (more efficient than full indexes)
CREATE INDEX IF NOT EXISTS idx_employees_active
  ON employees (id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_active
  ON leads (id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clients_active
  ON clients (id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_active
  ON interactions (id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 6. COMMENTS
-- ============================================================

COMMENT ON COLUMN employees.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN leads.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN clients.deleted_at IS 'Soft delete timestamp - NULL means active';
COMMENT ON COLUMN interactions.deleted_at IS 'Soft delete timestamp - NULL means active';

COMMENT ON VIEW active_employees IS 'View of non-deleted employees';
COMMENT ON VIEW active_leads IS 'View of non-deleted leads';
COMMENT ON VIEW active_clients IS 'View of non-deleted clients';
COMMENT ON VIEW active_interactions IS 'View of non-deleted interactions';

COMMENT ON FUNCTION soft_delete_record IS 'Soft delete a record by setting deleted_at';
COMMENT ON FUNCTION restore_record IS 'Restore a soft-deleted record by clearing deleted_at';
COMMENT ON FUNCTION check_last_admin IS 'Trigger function to prevent removing the last admin';
