-- Migration: Add Performance Indexes
-- Purpose: Optimize frequently used queries identified in code review
-- Date: 2024-01-21

-- ============================================================
-- 1. EMPLOYEES TABLE INDEXES
-- ============================================================

-- Index for role lookups (admin checks, filtering by role)
CREATE INDEX IF NOT EXISTS idx_employees_role
  ON employees (role)
  WHERE deleted_at IS NULL;

-- Index for email lookups (duplicate checks, login)
CREATE INDEX IF NOT EXISTS idx_employees_email
  ON employees (email)
  WHERE deleted_at IS NULL;

-- Index for auth user ID lookups
CREATE INDEX IF NOT EXISTS idx_employees_id
  ON employees (id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 2. LEADS TABLE INDEXES
-- ============================================================

-- Index for status filtering (kanban board, list views)
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads (status)
  WHERE deleted_at IS NULL;

-- Index for assigned employee filtering
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
  ON leads (assigned_to)
  WHERE deleted_at IS NULL;

-- Composite index for common query pattern: status + created_at
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at
  ON leads (status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for email lookups (duplicate checks)
CREATE INDEX IF NOT EXISTS idx_leads_email
  ON leads (email)
  WHERE deleted_at IS NULL;

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON leads (created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 3. CLIENTS TABLE INDEXES
-- ============================================================

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_clients_created_at
  ON clients (created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_clients_email
  ON clients (email)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 4. INTERACTIONS TABLE INDEXES
-- ============================================================

-- Index for lead interactions (timeline view)
CREATE INDEX IF NOT EXISTS idx_interactions_lead_id
  ON interactions (lead_id)
  WHERE deleted_at IS NULL AND lead_id IS NOT NULL;

-- Index for client interactions (timeline view)
CREATE INDEX IF NOT EXISTS idx_interactions_client_id
  ON interactions (client_id)
  WHERE deleted_at IS NULL AND client_id IS NOT NULL;

-- Index for sorting by created_at (audit trail, timelines)
CREATE INDEX IF NOT EXISTS idx_interactions_created_at
  ON interactions (created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_interactions_type
  ON interactions (type)
  WHERE deleted_at IS NULL;

-- Composite index for audit page: type + created_at
CREATE INDEX IF NOT EXISTS idx_interactions_type_created_at
  ON interactions (type, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 5. COVERING INDEXES FOR COMMON QUERIES
-- ============================================================

-- Covering index for employee list page (avoids table lookup)
CREATE INDEX IF NOT EXISTS idx_employees_list_covering
  ON employees (created_at DESC)
  INCLUDE (id, name, email, role)
  WHERE deleted_at IS NULL;

-- Covering index for leads kanban (status + key fields)
CREATE INDEX IF NOT EXISTS idx_leads_kanban_covering
  ON leads (status, created_at DESC)
  INCLUDE (id, name, email, company, assigned_to)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 6. COMMENTS
-- ============================================================

COMMENT ON INDEX idx_employees_role IS 'Optimize role-based filtering and admin checks';
COMMENT ON INDEX idx_leads_status IS 'Optimize kanban board status filtering';
COMMENT ON INDEX idx_leads_status_created_at IS 'Optimize sorted lists by status';
COMMENT ON INDEX idx_interactions_created_at IS 'Optimize audit trail and timeline queries';
COMMENT ON INDEX idx_interactions_lead_id IS 'Optimize lead interaction timeline';
COMMENT ON INDEX idx_interactions_client_id IS 'Optimize client interaction timeline';
