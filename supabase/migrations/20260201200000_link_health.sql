-- Link health monitoring table
CREATE TABLE seo_link_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug TEXT NOT NULL,
  target_url TEXT NOT NULL,
  status_code INTEGER,
  is_broken BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_link_checks_broken ON seo_link_checks(is_broken) WHERE is_broken = true;

ALTER TABLE seo_link_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage link checks"
  ON seo_link_checks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
