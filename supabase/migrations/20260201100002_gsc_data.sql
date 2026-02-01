-- Google Search Console data table
-- Stores daily performance metrics from GSC API

CREATE TABLE IF NOT EXISTS seo_gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  position NUMERIC(6,2) DEFAULT 0,
  top_queries JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_url, date)
);

-- Index for efficient date-based queries
CREATE INDEX idx_gsc_data_url_date ON seo_gsc_data(page_url, date DESC);

-- Index for finding pages by date
CREATE INDEX idx_gsc_data_date ON seo_gsc_data(date DESC);

-- RLS policies (admin-only access)
ALTER TABLE seo_gsc_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to GSC data"
  ON seo_gsc_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.role = 'admin'
      AND employees.deleted_at IS NULL
    )
  );
