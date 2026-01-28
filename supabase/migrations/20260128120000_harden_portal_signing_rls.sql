-- Migration: Harden portal signing RLS
--
-- The signing flows now use a service_role client with token validation,
-- so anonymous write access is no longer required.

DROP POLICY IF EXISTS "Anonymous can insert proposal_signatures" ON proposal_signatures;
DROP POLICY IF EXISTS "Anonymous can update client_msas for signing" ON client_msas;
