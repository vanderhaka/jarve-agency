-- Migration: Fix Portal Security
--
-- SECURITY: Drop all overly permissive anon policies for portal tables.
--
-- Background:
-- Portal actions previously used the anon client + permissive RLS policies.
-- This meant anyone who extracted the public anon key could query all portal data directly.
--
-- Solution:
-- Portal actions now use a service_role client that bypasses RLS.
-- Token validation happens in the server action code before any data access.
-- These anon policies are no longer needed and create security vulnerabilities.
--
-- Tables affected:
-- - invoices (view)
-- - invoice_line_items (view)
-- - payments (view)
-- - portal_messages (view, insert)
-- - client_uploads (view, insert)
-- - portal_read_state (view, insert, update)
-- - client_portal_tokens (read, update)
-- - client_users (read)
-- - agency_projects (read)
-- - contract_docs (view)
-- - clients (read)
--
-- Preserved policies:
-- - leads: Allow public insert (contact form)
-- - change_requests: Anonymous view/sign (signing flow)
-- - client_msas: Anonymous update for signing (signing flow)
-- - proposal_signatures: Anonymous insert (signing flow)
-- - storage.objects: Public access policies remain (handled separately)

-- =====================
-- INVOICES
-- =====================
DROP POLICY IF EXISTS "Anon can view invoices" ON invoices;

-- =====================
-- INVOICE LINE ITEMS
-- =====================
DROP POLICY IF EXISTS "Anon can view invoice_line_items" ON invoice_line_items;

-- =====================
-- PAYMENTS
-- =====================
DROP POLICY IF EXISTS "Anon can view payments" ON payments;

-- =====================
-- PORTAL MESSAGES
-- =====================
DROP POLICY IF EXISTS "Anon can view portal_messages" ON portal_messages;
DROP POLICY IF EXISTS "Anon can insert portal_messages" ON portal_messages;

-- =====================
-- CLIENT UPLOADS
-- =====================
DROP POLICY IF EXISTS "Anon can view client_uploads" ON client_uploads;
DROP POLICY IF EXISTS "Anon can insert client_uploads" ON client_uploads;

-- =====================
-- PORTAL READ STATE
-- =====================
DROP POLICY IF EXISTS "Anon can view portal_read_state" ON portal_read_state;
DROP POLICY IF EXISTS "Anon can insert portal_read_state" ON portal_read_state;
DROP POLICY IF EXISTS "Anon can update portal_read_state" ON portal_read_state;

-- =====================
-- CLIENT PORTAL TOKENS
-- =====================
DROP POLICY IF EXISTS "Anon can read tokens" ON client_portal_tokens;
DROP POLICY IF EXISTS "Anon can update token stats" ON client_portal_tokens;

-- =====================
-- CLIENT USERS
-- =====================
DROP POLICY IF EXISTS "Anon can read client_users" ON client_users;

-- =====================
-- AGENCY PROJECTS
-- =====================
DROP POLICY IF EXISTS "Anon can read agency_projects" ON agency_projects;

-- =====================
-- CONTRACT DOCS
-- =====================
DROP POLICY IF EXISTS "Anon can view contract_docs" ON contract_docs;

-- =====================
-- CLIENTS
-- =====================
DROP POLICY IF EXISTS "Anon can read clients" ON clients;

-- =====================
-- STORAGE POLICIES
-- =====================
-- Drop anon storage policies for client uploads and contract docs
-- Service role client bypasses storage RLS so these are not needed
DROP POLICY IF EXISTS "anon_insert_client_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_select_client_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_select_contract_docs" ON storage.objects;

-- =====================
-- VERIFICATION COMMENT
-- =====================
-- After applying this migration, verify no anon policies remain on portal tables:
--
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE roles::text LIKE '%anon%'
--   AND tablename IN (
--     'invoices', 'invoice_line_items', 'payments',
--     'portal_messages', 'client_uploads', 'portal_read_state',
--     'client_portal_tokens', 'client_users', 'agency_projects',
--     'contract_docs', 'clients'
--   );
--
-- Expected result: 0 rows
