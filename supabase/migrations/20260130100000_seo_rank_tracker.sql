-- SEO Rank Tracker: tables for tracking SERP positions via SerpAPI

-- Sites to track
CREATE TABLE IF NOT EXISTS tracked_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keywords per site
CREATE TABLE IF NOT EXISTS tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES tracked_sites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_id, keyword)
);

-- Daily ranking snapshots
CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  position INTEGER, -- null = not found in top 100
  url TEXT, -- which URL ranked
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  serp_data JSONB, -- raw snippet from SerpAPI for debugging
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(keyword_id, date)
);

-- Indexes for dashboard queries
CREATE INDEX idx_ranking_history_keyword_date ON ranking_history(keyword_id, date DESC);
CREATE INDEX idx_ranking_history_date ON ranking_history(date DESC);
CREATE INDEX idx_tracked_keywords_site ON tracked_keywords(site_id);

-- Seed jarve.com.au
INSERT INTO tracked_sites (domain, name) VALUES ('jarve.com.au', 'Jarve Agency');
