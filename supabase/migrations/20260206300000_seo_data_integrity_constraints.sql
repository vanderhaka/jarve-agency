-- Migration: SEO data integrity constraints
-- Phase 4, Step 4.1

-- 1. CHECK constraint on seo_pages.status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_pages_status_check'
  ) THEN
    ALTER TABLE seo_pages
      ADD CONSTRAINT seo_pages_status_check
      CHECK (status IN ('draft', 'published'));
  END IF;
END;
$$;

-- 2. CHECK constraints on seo_alerts columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_alerts_status_check'
  ) THEN
    ALTER TABLE seo_alerts
      ADD CONSTRAINT seo_alerts_status_check
      CHECK (status IN ('active', 'acknowledged', 'resolved'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_alerts_severity_check'
  ) THEN
    ALTER TABLE seo_alerts
      ADD CONSTRAINT seo_alerts_severity_check
      CHECK (severity IN ('info', 'warning', 'critical'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_alerts_type_check'
  ) THEN
    ALTER TABLE seo_alerts
      ADD CONSTRAINT seo_alerts_type_check
      CHECK (type IN ('ranking_drop', 'ranking_lost', 'publish_failed', 'quality_gate_spike', 'broken_links'));
  END IF;
END;
$$;

-- 3. FK on seo_link_checks.source_slug -> seo_pages.slug with CASCADE
-- First deduplicate any orphaned link checks not referencing valid slugs
DELETE FROM seo_link_checks
WHERE source_slug NOT IN (SELECT slug FROM seo_pages);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'seo_link_checks_source_slug_fk'
  ) THEN
    ALTER TABLE seo_link_checks
      ADD CONSTRAINT seo_link_checks_source_slug_fk
      FOREIGN KEY (source_slug) REFERENCES seo_pages(slug) ON DELETE CASCADE;
  END IF;
END;
$$;
