-- Add scheduled publishing support
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

CREATE INDEX idx_seo_pages_scheduled
  ON seo_pages(scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND status = 'draft';
