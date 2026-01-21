-- ============================================================
-- JARVE CRM - Database Integrity Migrations
-- Run this script in Supabase Dashboard SQL Editor
-- ============================================================
-- This script adds:
-- 1. Foreign key constraints with proper cascades
-- 2. Soft delete columns and functions
-- 3. Row Level Security policies
-- 4. Performance indexes
-- 5. Safe employee management functions
-- ============================================================

-- ============================================================
-- PART 1: FOREIGN KEY CONSTRAINTS
-- ============================================================

DO $$
BEGIN
  -- interactions -> leads FK
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interactions') THEN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'lead_id') THEN
        ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_lead_id_fkey;
        ALTER TABLE interactions
          ADD CONSTRAINT interactions_lead_id_fkey
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added interactions_lead_id_fkey';
      END IF;
    END IF;

    -- interactions -> clients FK
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'client_id') THEN
        ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_client_id_fkey;
        ALTER TABLE interactions
          ADD CONSTRAINT interactions_client_id_fkey
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added interactions_client_id_fkey';
      END IF;
    END IF;
  END IF;

  -- leads -> employees FK (assigned_to)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
        ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
        ALTER TABLE leads
          ADD CONSTRAINT leads_assigned_to_fkey
            FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added leads_assigned_to_fkey';
      END IF;
    END IF;
  END IF;

  -- employees -> employees FK (created_by)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_by') THEN
      ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_created_by_fkey;
      ALTER TABLE employees
        ADD CONSTRAINT employees_created_by_fkey
          FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL ON UPDATE CASCADE;
      RAISE NOTICE 'Added employees_created_by_fkey';
    END IF;
  END IF;

  RAISE NOTICE 'Part 1 complete: Foreign key constraints';
END $$;

-- ============================================================
-- PART 2: CHECK CONSTRAINTS
-- ============================================================

DO $$
BEGIN
  -- Employees role check
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
    ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (role IN ('employee', 'admin'));
    RAISE NOTICE 'Added employees_role_check';
  END IF;

  -- Interactions type check
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'type') THEN
    ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_type_check;
    ALTER TABLE interactions ADD CONSTRAINT interactions_type_check CHECK (type IN ('call', 'email', 'meeting', 'note'));
    RAISE NOTICE 'Added interactions_type_check';
  END IF;

  -- Leads status check
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
    ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
    ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new', 'contacted', 'converted', 'closed'));
    RAISE NOTICE 'Added leads_status_check';
  END IF;

  RAISE NOTICE 'Part 2 complete: Check constraints';
END $$;

-- ============================================================
-- PART 3: SOFT DELETE COLUMNS
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'deleted_at') THEN
      ALTER TABLE employees ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
      RAISE NOTICE 'Added deleted_at to employees';
    END IF;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'deleted_at') THEN
      ALTER TABLE leads ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
      RAISE NOTICE 'Added deleted_at to leads';
    END IF;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'deleted_at') THEN
      ALTER TABLE clients ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
      RAISE NOTICE 'Added deleted_at to clients';
    END IF;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interactions') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'deleted_at') THEN
      ALTER TABLE interactions ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
      RAISE NOTICE 'Added deleted_at to interactions';
    END IF;
  END IF;

  RAISE NOTICE 'Part 3 complete: Soft delete columns';
END $$;

-- ============================================================
-- PART 4: LAST ADMIN PROTECTION
-- ============================================================

CREATE OR REPLACE FUNCTION check_last_admin()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
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

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    DROP TRIGGER IF EXISTS prevent_last_admin_deletion ON employees;
    CREATE TRIGGER prevent_last_admin_deletion
      BEFORE UPDATE OR DELETE ON employees
      FOR EACH ROW
      EXECUTE FUNCTION check_last_admin();
    RAISE NOTICE 'Added last admin protection trigger';
  END IF;
END $$;

-- ============================================================
-- PART 5: RLS HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees
    WHERE id = auth.uid()
      AND role = 'admin'
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_employee()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees
    WHERE id = auth.uid()
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

RAISE NOTICE 'Part 5 complete: RLS helper functions';

-- ============================================================
-- PART 6: ENABLE RLS AND POLICIES
-- ============================================================

DO $$
BEGIN
  -- EMPLOYEES
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can read own employee record" ON employees;
    CREATE POLICY "Users can read own employee record" ON employees FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Admins can read all employees" ON employees;
    CREATE POLICY "Admins can read all employees" ON employees FOR SELECT USING (is_admin());

    DROP POLICY IF EXISTS "Admins can insert employees" ON employees;
    CREATE POLICY "Admins can insert employees" ON employees FOR INSERT WITH CHECK (is_admin());

    DROP POLICY IF EXISTS "Admins can update employees" ON employees;
    CREATE POLICY "Admins can update employees" ON employees FOR UPDATE USING (is_admin());

    DROP POLICY IF EXISTS "Users can update own profile" ON employees;
    CREATE POLICY "Users can update own profile" ON employees FOR UPDATE USING (auth.uid() = id);

    RAISE NOTICE 'RLS enabled on employees';
  END IF;

  -- LEADS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Employees can read all leads" ON leads;
    CREATE POLICY "Employees can read all leads" ON leads FOR SELECT USING (is_employee());

    DROP POLICY IF EXISTS "Employees can insert leads" ON leads;
    CREATE POLICY "Employees can insert leads" ON leads FOR INSERT WITH CHECK (is_employee());

    DROP POLICY IF EXISTS "Employees can update leads" ON leads;
    CREATE POLICY "Employees can update leads" ON leads FOR UPDATE USING (is_employee());

    DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
    CREATE POLICY "Admins can delete leads" ON leads FOR DELETE USING (is_admin());

    RAISE NOTICE 'RLS enabled on leads';
  END IF;

  -- CLIENTS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Employees can read all clients" ON clients;
    CREATE POLICY "Employees can read all clients" ON clients FOR SELECT USING (is_employee());

    DROP POLICY IF EXISTS "Employees can insert clients" ON clients;
    CREATE POLICY "Employees can insert clients" ON clients FOR INSERT WITH CHECK (is_employee());

    DROP POLICY IF EXISTS "Employees can update clients" ON clients;
    CREATE POLICY "Employees can update clients" ON clients FOR UPDATE USING (is_employee());

    DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
    CREATE POLICY "Admins can delete clients" ON clients FOR DELETE USING (is_admin());

    RAISE NOTICE 'RLS enabled on clients';
  END IF;

  -- INTERACTIONS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interactions') THEN
    ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Employees can read all interactions" ON interactions;
    CREATE POLICY "Employees can read all interactions" ON interactions FOR SELECT USING (is_employee());

    DROP POLICY IF EXISTS "Employees can insert interactions" ON interactions;
    CREATE POLICY "Employees can insert interactions" ON interactions FOR INSERT WITH CHECK (is_employee());

    DROP POLICY IF EXISTS "Employees can update interactions" ON interactions;
    CREATE POLICY "Employees can update interactions" ON interactions FOR UPDATE USING (is_employee());

    DROP POLICY IF EXISTS "Admins can delete interactions" ON interactions;
    CREATE POLICY "Admins can delete interactions" ON interactions FOR DELETE USING (is_admin());

    RAISE NOTICE 'RLS enabled on interactions';
  END IF;

  RAISE NOTICE 'Part 6 complete: RLS policies';
END $$;

-- ============================================================
-- PART 7: INDEXES
-- ============================================================

DO $$
BEGIN
  -- Employees indexes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    CREATE INDEX IF NOT EXISTS idx_employees_role ON employees (role) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_employees_active ON employees (id) WHERE deleted_at IS NULL;
    RAISE NOTICE 'Created employees indexes';
  END IF;

  -- Leads indexes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads (assigned_to) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_active ON leads (id) WHERE deleted_at IS NULL;
    RAISE NOTICE 'Created leads indexes';
  END IF;

  -- Clients indexes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at DESC) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_clients_active ON clients (id) WHERE deleted_at IS NULL;
    RAISE NOTICE 'Created clients indexes';
  END IF;

  -- Interactions indexes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interactions') THEN
    CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions (lead_id) WHERE deleted_at IS NULL AND lead_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_interactions_client_id ON interactions (client_id) WHERE deleted_at IS NULL AND client_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions (created_at DESC) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions (type) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_interactions_active ON interactions (id) WHERE deleted_at IS NULL;
    RAISE NOTICE 'Created interactions indexes';
  END IF;

  RAISE NOTICE 'Part 7 complete: Indexes';
END $$;

-- ============================================================
-- PART 8: SAFE EMPLOYEE MANAGEMENT FUNCTIONS
-- ============================================================

-- Check email availability
CREATE OR REPLACE FUNCTION check_email_available(p_email TEXT)
RETURNS JSON AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE email = lower(trim(p_email))
      AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object('available', false, 'reason', 'email already registered');
  END IF;

  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(trim(p_email))
  ) THEN
    RETURN json_build_object('available', false, 'reason', 'email already has an account');
  END IF;

  RETURN json_build_object('available', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create employee record safely
CREATE OR REPLACE FUNCTION create_employee_record(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'employee',
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'user_id is required');
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'email is required');
  END IF;

  IF p_name IS NULL OR p_name = '' THEN
    RETURN json_build_object('success', false, 'error', 'name is required');
  END IF;

  IF p_role NOT IN ('employee', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'role must be employee or admin');
  END IF;

  IF EXISTS (SELECT 1 FROM employees WHERE email = p_email AND deleted_at IS NULL AND id != p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'email already exists');
  END IF;

  INSERT INTO employees (id, email, name, role, created_by, created_at, updated_at)
  VALUES (p_user_id, p_email, p_name, p_role, p_created_by, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW()
  WHERE employees.deleted_at IS NULL;

  RETURN json_build_object('success', true, 'employee_id', p_user_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'email already exists');
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin count
CREATE OR REPLACE FUNCTION get_admin_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM employees
    WHERE role = 'admin'
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Safe role change
CREATE OR REPLACE FUNCTION change_employee_role(
  p_employee_id UUID,
  p_new_role TEXT,
  p_changed_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_current_role TEXT;
  v_admin_count INTEGER;
BEGIN
  SELECT role INTO v_current_role
  FROM employees
  WHERE id = p_employee_id AND deleted_at IS NULL;

  IF v_current_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Employee not found');
  END IF;

  IF p_new_role NOT IN ('employee', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role');
  END IF;

  IF v_current_role = 'admin' AND p_new_role = 'employee' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM employees
    WHERE role = 'admin'
      AND deleted_at IS NULL
      AND id != p_employee_id;

    IF v_admin_count = 0 THEN
      RETURN json_build_object('success', false, 'error', 'Cannot remove last admin');
    END IF;
  END IF;

  UPDATE employees
  SET role = p_new_role, updated_at = NOW()
  WHERE id = p_employee_id AND deleted_at IS NULL;

  RETURN json_build_object('success', true, 'previous_role', v_current_role, 'new_role', p_new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe employee soft delete
CREATE OR REPLACE FUNCTION soft_delete_employee(
  p_employee_id UUID,
  p_deleted_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_employee_role TEXT;
  v_admin_count INTEGER;
BEGIN
  SELECT role INTO v_employee_role
  FROM employees
  WHERE id = p_employee_id AND deleted_at IS NULL;

  IF v_employee_role IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Employee not found or already deleted');
  END IF;

  IF v_employee_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM employees
    WHERE role = 'admin'
      AND deleted_at IS NULL
      AND id != p_employee_id;

    IF v_admin_count = 0 THEN
      RETURN json_build_object('success', false, 'error', 'Cannot delete last admin');
    END IF;
  END IF;

  UPDATE employees
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_employee_id AND deleted_at IS NULL;

  UPDATE leads
  SET assigned_to = NULL, updated_at = NOW()
  WHERE assigned_to = p_employee_id;

  RETURN json_build_object('success', true, 'deleted_id', p_employee_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_email_available TO authenticated;
GRANT EXECUTE ON FUNCTION create_employee_record TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_count TO authenticated;
GRANT EXECUTE ON FUNCTION change_employee_role TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_employee TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_employee TO authenticated;

SELECT 'Migration complete! Check NOTICE messages above for details.' as status;
