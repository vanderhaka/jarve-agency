-- Add unique constraint for upsert on re-checks of the same link
ALTER TABLE seo_link_checks
  ADD CONSTRAINT seo_link_checks_source_target_unique
  UNIQUE (source_slug, target_url);
