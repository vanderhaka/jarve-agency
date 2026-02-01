-- Create seo_alerts table for monitoring pSEO health
CREATE TABLE IF NOT EXISTS seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- ranking_drop, ranking_lost, publish_failed, quality_gate_spike
  severity TEXT NOT NULL DEFAULT 'warning', -- info, warning, critical
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active', -- active, acknowledged, resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for dashboard queries
CREATE INDEX idx_seo_alerts_status ON seo_alerts(status);
CREATE INDEX idx_seo_alerts_type ON seo_alerts(type);
CREATE INDEX idx_seo_alerts_created ON seo_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE seo_alerts ENABLE ROW LEVEL SECURITY;

-- Authenticated users get full access
CREATE POLICY "authenticated_full_access_seo_alerts"
  ON seo_alerts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
