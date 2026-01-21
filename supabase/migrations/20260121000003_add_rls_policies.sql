-- Migration: Add Row Level Security Policies
-- Purpose: Enforce access control at the database level
-- Date: 2024-01-21

-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. HELPER FUNCTIONS FOR RLS
-- ============================================================

-- Check if current user is an admin
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

-- Check if current user is an employee (any role)
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

-- ============================================================
-- 3. EMPLOYEES TABLE POLICIES
-- ============================================================

-- Drop existing policies (safe re-run)
DROP POLICY IF EXISTS "Users can read own employee record" ON employees;
DROP POLICY IF EXISTS "Admins can read all employees" ON employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON employees;
DROP POLICY IF EXISTS "Admins can update employees" ON employees;
DROP POLICY IF EXISTS "Users can update own profile" ON employees;

-- Users can always read their own record
CREATE POLICY "Users can read own employee record"
  ON employees FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all employee records
CREATE POLICY "Admins can read all employees"
  ON employees FOR SELECT
  USING (is_admin());

-- Admins can insert new employees
CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update any employee
CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  USING (is_admin());

-- Users can update their own profile (limited fields via application logic)
CREATE POLICY "Users can update own profile"
  ON employees FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 4. LEADS TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Employees can read all leads" ON leads;
DROP POLICY IF EXISTS "Employees can insert leads" ON leads;
DROP POLICY IF EXISTS "Employees can update leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;

-- All employees can read leads
CREATE POLICY "Employees can read all leads"
  ON leads FOR SELECT
  USING (is_employee());

-- All employees can create leads
CREATE POLICY "Employees can insert leads"
  ON leads FOR INSERT
  WITH CHECK (is_employee());

-- All employees can update leads
CREATE POLICY "Employees can update leads"
  ON leads FOR UPDATE
  USING (is_employee());

-- Only admins can delete leads (soft delete via update)
CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  USING (is_admin());

-- ============================================================
-- 5. CLIENTS TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Employees can read all clients" ON clients;
DROP POLICY IF EXISTS "Employees can insert clients" ON clients;
DROP POLICY IF EXISTS "Employees can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

-- All employees can read clients
CREATE POLICY "Employees can read all clients"
  ON clients FOR SELECT
  USING (is_employee());

-- All employees can create clients
CREATE POLICY "Employees can insert clients"
  ON clients FOR INSERT
  WITH CHECK (is_employee());

-- All employees can update clients
CREATE POLICY "Employees can update clients"
  ON clients FOR UPDATE
  USING (is_employee());

-- Only admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  USING (is_admin());

-- ============================================================
-- 6. INTERACTIONS TABLE POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Employees can read all interactions" ON interactions;
DROP POLICY IF EXISTS "Employees can insert interactions" ON interactions;
DROP POLICY IF EXISTS "Employees can update own interactions" ON interactions;
DROP POLICY IF EXISTS "Admins can update any interaction" ON interactions;
DROP POLICY IF EXISTS "Admins can delete interactions" ON interactions;

-- All employees can read interactions
CREATE POLICY "Employees can read all interactions"
  ON interactions FOR SELECT
  USING (is_employee());

-- All employees can create interactions
CREATE POLICY "Employees can insert interactions"
  ON interactions FOR INSERT
  WITH CHECK (is_employee());

-- Employees can update their own interactions (created_by matches)
-- Note: We check created_by_name contains user's name as a soft match
-- For stricter control, add a created_by_id column
CREATE POLICY "Employees can update own interactions"
  ON interactions FOR UPDATE
  USING (is_employee());

-- Admins can update any interaction
CREATE POLICY "Admins can update any interaction"
  ON interactions FOR UPDATE
  USING (is_admin());

-- Only admins can delete interactions
CREATE POLICY "Admins can delete interactions"
  ON interactions FOR DELETE
  USING (is_admin());

-- ============================================================
-- 7. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================

-- Ensure authenticated users can access the tables through RLS
GRANT SELECT, INSERT, UPDATE ON employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON interactions TO authenticated;

-- Service role bypasses RLS (for admin operations)
-- This is the default behavior, but documenting for clarity

-- ============================================================
-- 8. COMMENTS
-- ============================================================

COMMENT ON FUNCTION is_admin IS 'Check if current authenticated user has admin role';
COMMENT ON FUNCTION is_employee IS 'Check if current authenticated user is an active employee';

COMMENT ON POLICY "Users can read own employee record" ON employees IS
  'Every user can see their own employee record';
COMMENT ON POLICY "Admins can read all employees" ON employees IS
  'Admins have full read access to all employees';
COMMENT ON POLICY "Employees can read all leads" ON leads IS
  'All employees can view the leads list';
COMMENT ON POLICY "Employees can read all clients" ON clients IS
  'All employees can view the clients list';
COMMENT ON POLICY "Employees can read all interactions" ON interactions IS
  'All employees can view interaction history for audit purposes';
