-- Create seo_page_versions table for content history tracking
CREATE TABLE IF NOT EXISTS seo_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, version_number)
);

-- Index for efficient version history queries
CREATE INDEX idx_page_versions_page ON seo_page_versions(page_id, version_number DESC);

-- Enable RLS
ALTER TABLE seo_page_versions ENABLE ROW LEVEL SECURITY;

-- Authenticated users get full access
CREATE POLICY "authenticated_full_access_page_versions"
  ON seo_page_versions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
