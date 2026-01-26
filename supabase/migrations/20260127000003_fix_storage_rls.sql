-- Fix storage RLS policies for client-uploads bucket
-- Drop existing policies if they exist (ignore errors)

DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Anon users can upload to client-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Anon users can read from client-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can manage client-uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Anon users can read from contract-docs" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can manage contract-docs" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors
  NULL;
END $$;

-- Ensure RLS is enabled on storage.objects (it should be by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for client-uploads bucket
-- Allow anon users to upload
CREATE POLICY "anon_insert_client_uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'client-uploads');

-- Allow anon users to read their uploads
CREATE POLICY "anon_select_client_uploads" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'client-uploads');

-- Allow authenticated users full access to client-uploads
CREATE POLICY "auth_all_client_uploads" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-uploads')
  WITH CHECK (bucket_id = 'client-uploads');

-- Create policies for contract-docs bucket
-- Allow anon users to read
CREATE POLICY "anon_select_contract_docs" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'contract-docs');

-- Allow authenticated users full access to contract-docs
CREATE POLICY "auth_all_contract_docs" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'contract-docs')
  WITH CHECK (bucket_id = 'contract-docs');
