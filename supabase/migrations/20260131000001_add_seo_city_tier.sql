-- Add city_tier to seo_pages for tiered drip ordering

ALTER TABLE seo_pages
  ADD COLUMN IF NOT EXISTS city_tier SMALLINT;

ALTER TABLE seo_pages
  ADD CONSTRAINT seo_pages_city_tier_check
  CHECK (city_tier IS NULL OR city_tier IN (1, 2));

WITH city_tiers (city_slug, tier) AS (
  VALUES
    ('sydney', 1),
    ('melbourne', 1),
    ('brisbane', 1),
    ('perth', 1),
    ('adelaide', 1),
    ('gold-coast', 2),
    ('canberra', 2),
    ('newcastle', 2),
    ('wollongong', 2),
    ('hobart', 2),
    ('geelong', 2),
    ('sunshine-coast', 2),
    ('townsville', 2),
    ('cairns', 2),
    ('darwin', 2)
)
UPDATE seo_pages p
SET city_tier = ct.tier
FROM city_tiers ct
WHERE p.route_pattern IN ('services-city', 'industries-city')
  AND p.slug LIKE '%-' || ct.city_slug
  AND p.city_tier IS NULL;

CREATE INDEX IF NOT EXISTS idx_seo_pages_route_pattern_city_tier_created_at
  ON seo_pages (route_pattern, city_tier, created_at);
