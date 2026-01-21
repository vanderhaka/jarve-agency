-- Migration: Add Safe Employee Invite Function
-- Purpose: Transaction-safe employee creation to prevent orphaned records
-- Date: 2024-01-21

-- ============================================================
-- 1. CREATE EMPLOYEE SAFELY (After Auth User Created)
-- ============================================================

-- This function is called AFTER Supabase Auth creates the user
-- It ensures the employee record is created atomically
-- If this fails, the application should handle cleanup

CREATE OR REPLACE FUNCTION create_employee_record(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'employee',
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_id is required'
    );
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'email is required'
    );
  END IF;

  IF p_name IS NULL OR p_name = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'name is required'
    );
  END IF;

  IF p_role NOT IN ('employee', 'admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'role must be employee or admin'
    );
  END IF;

  -- Check for duplicate email
  IF EXISTS (SELECT 1 FROM employees WHERE email = p_email AND deleted_at IS NULL) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'email already exists'
    );
  END IF;

  -- Insert or update the employee record
  INSERT INTO employees (id, email, name, role, created_by, created_at, updated_at)
  VALUES (p_user_id, p_email, p_name, p_role, p_created_by, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW()
  WHERE employees.deleted_at IS NULL;

  RETURN json_build_object(
    'success', true,
    'employee_id', p_user_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'email already exists'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. CHECK DUPLICATE EMAIL BEFORE INVITE
-- ============================================================

CREATE OR REPLACE FUNCTION check_email_available(p_email TEXT)
RETURNS JSON AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE email = lower(trim(p_email))
      AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object(
      'available', false,
      'reason', 'email already registered'
    );
  END IF;

  -- Also check auth.users if accessible
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = lower(trim(p_email))
  ) THEN
    RETURN json_build_object(
      'available', false,
      'reason', 'email already has an account'
    );
  END IF;

  RETURN json_build_object('available', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. GET ADMIN COUNT (For Last Admin Protection)
-- ============================================================

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

-- ============================================================
-- 4. SAFE ROLE CHANGE (Prevents Last Admin Removal)
-- ============================================================

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
  -- Get current role
  SELECT role INTO v_current_role
  FROM employees
  WHERE id = p_employee_id AND deleted_at IS NULL;

  IF v_current_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Employee not found'
    );
  END IF;

  IF p_new_role NOT IN ('employee', 'admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role'
    );
  END IF;

  -- If demoting from admin, check admin count
  IF v_current_role = 'admin' AND p_new_role = 'employee' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM employees
    WHERE role = 'admin'
      AND deleted_at IS NULL
      AND id != p_employee_id;

    IF v_admin_count = 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cannot remove last admin'
      );
    END IF;
  END IF;

  -- Update the role
  UPDATE employees
  SET role = p_new_role,
      updated_at = NOW()
  WHERE id = p_employee_id AND deleted_at IS NULL;

  RETURN json_build_object(
    'success', true,
    'previous_role', v_current_role,
    'new_role', p_new_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. SAFE EMPLOYEE SOFT DELETE
-- ============================================================

CREATE OR REPLACE FUNCTION soft_delete_employee(
  p_employee_id UUID,
  p_deleted_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_employee_role TEXT;
  v_admin_count INTEGER;
BEGIN
  -- Get employee role
  SELECT role INTO v_employee_role
  FROM employees
  WHERE id = p_employee_id AND deleted_at IS NULL;

  IF v_employee_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Employee not found or already deleted'
    );
  END IF;

  -- If deleting an admin, check admin count
  IF v_employee_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM employees
    WHERE role = 'admin'
      AND deleted_at IS NULL
      AND id != p_employee_id;

    IF v_admin_count = 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Cannot delete last admin'
      );
    END IF;
  END IF;

  -- Soft delete the employee
  UPDATE employees
  SET deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_employee_id AND deleted_at IS NULL;

  -- Unassign from any leads
  UPDATE leads
  SET assigned_to = NULL,
      updated_at = NOW()
  WHERE assigned_to = p_employee_id;

  RETURN json_build_object(
    'success', true,
    'deleted_id', p_employee_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. GRANT EXECUTE PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION create_employee_record TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_available TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_count TO authenticated;
GRANT EXECUTE ON FUNCTION change_employee_role TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_employee TO authenticated;

-- ============================================================
-- 7. COMMENTS
-- ============================================================

COMMENT ON FUNCTION create_employee_record IS
  'Safely create employee record after auth user creation. Returns JSON with success/error.';

COMMENT ON FUNCTION check_email_available IS
  'Check if email is available for new employee invite. Checks both employees and auth.users.';

COMMENT ON FUNCTION get_admin_count IS
  'Get count of active admins. Used for last-admin protection checks.';

COMMENT ON FUNCTION change_employee_role IS
  'Safely change employee role with last-admin protection.';

COMMENT ON FUNCTION soft_delete_employee IS
  'Safely soft-delete employee with last-admin protection and lead unassignment.';
