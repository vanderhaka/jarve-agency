-- Migration: Add Foreign Key Constraints with Proper Cascades
-- Purpose: Prevent orphaned records and ensure data integrity
-- Date: 2026-01-21
-- Note: All statements are conditional - only run if tables exist

-- ============================================================
-- 1. INTERACTIONS TABLE - Cascade on lead/client deletion
-- ============================================================

DO $$
BEGIN
  -- Only run if interactions table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interactions') THEN

    -- Drop existing constraints if they exist
    ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_lead_id_fkey;
    ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_client_id_fkey;

    -- Add FK for lead_id with SET NULL on delete (if leads table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'lead_id') THEN
        ALTER TABLE interactions
          ADD CONSTRAINT interactions_lead_id_fkey
            FOREIGN KEY (lead_id)
            REFERENCES leads(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
      END IF;
    END IF;

    -- Add FK for client_id with SET NULL on delete (if clients table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'client_id') THEN
        ALTER TABLE interactions
          ADD CONSTRAINT interactions_client_id_fkey
            FOREIGN KEY (client_id)
            REFERENCES clients(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
      END IF;
    END IF;

  END IF;
END $$;

-- ============================================================
-- 2. LEADS TABLE - Handle assigned employee deletion
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_to') THEN
        ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
        ALTER TABLE leads
          ADD CONSTRAINT leads_assigned_to_fkey
            FOREIGN KEY (assigned_to)
            REFERENCES employees(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 3. EMPLOYEES TABLE - Track creator relationships
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'created_by') THEN
      ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_created_by_fkey;
      ALTER TABLE employees
        ADD CONSTRAINT employees_created_by_fkey
          FOREIGN KEY (created_by)
          REFERENCES employees(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 4. DATA INTEGRITY CONSTRAINTS
-- ============================================================

DO $$
BEGIN
  -- Employees role check
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
      ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
      ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (role IN ('employee', 'admin'));
    END IF;

    -- Unique email for employees
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'email') THEN
      ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_unique;
      -- Only add if not already exists
      IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'employees_email_unique') THEN
        ALTER TABLE employees ADD CONSTRAINT employees_email_unique UNIQUE (email);
      END IF;
    END IF;
  END IF;

  -- Interactions type check
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interactions') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'type') THEN
      ALTER TABLE interactions DROP CONSTRAINT IF EXISTS interactions_type_check;
      ALTER TABLE interactions ADD CONSTRAINT interactions_type_check CHECK (type IN ('call', 'email', 'meeting', 'note'));
    END IF;
  END IF;

  -- Leads status check and unique email
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
      ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
      ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new', 'contacted', 'converted', 'closed'));
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
      ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_email_unique;
      IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'leads_email_unique') THEN
        ALTER TABLE leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
      END IF;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 5. COMMENTS FOR DOCUMENTATION (only if constraints exist)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'interactions_lead_id_fkey') THEN
    COMMENT ON CONSTRAINT interactions_lead_id_fkey ON interactions IS 'FK to leads - SET NULL on delete to preserve history';
  END IF;

  IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'interactions_client_id_fkey') THEN
    COMMENT ON CONSTRAINT interactions_client_id_fkey ON interactions IS 'FK to clients - SET NULL on delete to preserve history';
  END IF;

  IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'leads_assigned_to_fkey') THEN
    COMMENT ON CONSTRAINT leads_assigned_to_fkey ON leads IS 'FK to employees - SET NULL on delete to unassign';
  END IF;

  IF EXISTS (SELECT FROM pg_constraint WHERE conname = 'employees_created_by_fkey') THEN
    COMMENT ON CONSTRAINT employees_created_by_fkey ON employees IS 'FK to employees (self-ref) - SET NULL on delete';
  END IF;
END $$;
