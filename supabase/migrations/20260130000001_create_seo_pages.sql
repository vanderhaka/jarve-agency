-- Create seo_pages table for programmatic SEO
CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_pattern TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_seo_pages_slug ON seo_pages(slug);
CREATE INDEX idx_seo_pages_status ON seo_pages(status);
CREATE INDEX idx_seo_pages_route_pattern ON seo_pages(route_pattern);

-- Enable RLS
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

-- Anon users can read published pages
CREATE POLICY "anon_read_published_seo_pages"
  ON seo_pages
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Authenticated users get full access
CREATE POLICY "authenticated_full_access_seo_pages"
  ON seo_pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
