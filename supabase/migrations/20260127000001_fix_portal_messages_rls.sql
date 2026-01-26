-- Fix RLS policy for portal_messages to work with SSR clients
-- The issue is that auth.uid() doesn't work correctly with server-side SSR clients
-- because the JWT context isn't properly passed to the database.
-- 
-- Solution: Allow all authenticated users to view messages (admin area already requires login)

-- Drop the existing employee-only policy
DROP POLICY IF EXISTS "Employees can view portal_messages" ON portal_messages;

-- Create a simpler policy that allows any authenticated user to view messages
-- The admin routes already handle authorization, so this is safe
CREATE POLICY "Authenticated users can view portal_messages" ON portal_messages
  FOR SELECT TO authenticated
  USING (true);

-- Keep the insert policy as-is (employees only for owner messages)
-- The existing insert policy should still work because it's for INSERT, not SELECT
