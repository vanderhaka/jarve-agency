-- Atomic page publish function: creates version + updates status in one transaction.
-- Phase 4, Step 4.2

CREATE OR REPLACE FUNCTION publish_page(
  p_page_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_page RECORD;
  v_version seo_page_versions;
BEGIN
  -- Lock and fetch the page
  SELECT id, slug, content, meta_title, meta_description, status, scheduled_publish_at
  INTO v_page
  FROM seo_pages
  WHERE id = p_page_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Page not found');
  END IF;

  IF v_page.status != 'draft' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only draft pages can be published');
  END IF;

  -- Create version atomically
  v_version := create_page_version(
    p_page_id,
    v_page.content,
    v_page.meta_title,
    v_page.meta_description
  );

  -- Update page status
  UPDATE seo_pages
  SET status = 'published',
      scheduled_publish_at = NULL,
      updated_at = NOW()
  WHERE id = p_page_id;

  RETURN jsonb_build_object(
    'success', true,
    'slug', v_page.slug,
    'version_number', v_version.version_number
  );
END;
$$;

-- Atomic refresh + version function: creates version + updates content in one transaction.
CREATE OR REPLACE FUNCTION update_page_content(
  p_page_id UUID,
  p_content JSONB,
  p_meta_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_page RECORD;
  v_version seo_page_versions;
BEGIN
  -- Lock and fetch the page
  SELECT id, meta_title, meta_description
  INTO v_page
  FROM seo_pages
  WHERE id = p_page_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Page not found');
  END IF;

  -- Create version atomically
  v_version := create_page_version(
    p_page_id,
    p_content,
    v_page.meta_title,
    COALESCE(p_meta_description, v_page.meta_description)
  );

  -- Update page content
  UPDATE seo_pages
  SET content = p_content,
      meta_description = COALESCE(p_meta_description, meta_description),
      updated_at = NOW()
  WHERE id = p_page_id;

  RETURN jsonb_build_object(
    'success', true,
    'version_number', v_version.version_number
  );
END;
$$;
