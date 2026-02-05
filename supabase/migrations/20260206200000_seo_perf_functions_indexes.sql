-- Migration: SEO performance DB functions, indexes, and updated_at trigger
-- Phase 3, Step 3.2

-- 1. Status counts function (replaces client-side filtering)
CREATE OR REPLACE FUNCTION get_seo_status_counts()
RETURNS TABLE(status TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT status, COUNT(*) as count
  FROM seo_pages
  GROUP BY status;
$$;

-- 2. Breakdown by route_pattern + city_tier (replaces client-side aggregation)
CREATE OR REPLACE FUNCTION get_seo_breakdown()
RETURNS TABLE(route_pattern TEXT, city_tier INT, status TEXT, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT route_pattern, city_tier, status, COUNT(*) as count
  FROM seo_pages
  GROUP BY route_pattern, city_tier, status
  ORDER BY route_pattern, city_tier;
$$;

-- 3. Composite index for drip query (draft pages ordered by wave priority)
CREATE INDEX IF NOT EXISTS idx_seo_pages_drip_query
  ON seo_pages(route_pattern, city_tier, created_at)
  WHERE status = 'draft';

-- 4. Index for scheduled pages lookup
CREATE INDEX IF NOT EXISTS idx_seo_pages_scheduled
  ON seo_pages(scheduled_publish_at)
  WHERE status = 'draft' AND scheduled_publish_at IS NOT NULL;

-- 5. updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to seo_pages (skip if trigger already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seo_pages_updated_at'
  ) THEN
    CREATE TRIGGER trg_seo_pages_updated_at
      BEFORE UPDATE ON seo_pages
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
