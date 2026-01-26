-- Create storage buckets for client portal
-- This migration creates the client-uploads and contract-docs buckets

-- Create client-uploads bucket (for client file uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-uploads',
  'client-uploads',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create contract-docs bucket (for contracts/invoices)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-docs',
  'contract-docs',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for client-uploads bucket
-- Allow anon users to upload (portal clients)
CREATE POLICY "Anon users can upload to client-uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'client-uploads');

-- Allow anon users to read (for downloads via signed URL)
CREATE POLICY "Anon users can read from client-uploads" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'client-uploads');

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can manage client-uploads" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-uploads');

-- RLS policies for contract-docs bucket
-- Anon can only read (via signed URL)
CREATE POLICY "Anon users can read from contract-docs" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'contract-docs');

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage contract-docs" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'contract-docs');
