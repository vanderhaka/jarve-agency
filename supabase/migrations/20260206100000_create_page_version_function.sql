-- Atomic version creation function to prevent race conditions.
-- Uses row-level locking (FOR UPDATE) to ensure sequential version numbers.
CREATE OR REPLACE FUNCTION create_page_version(
  p_page_id UUID,
  p_content JSONB,
  p_meta_title TEXT DEFAULT NULL,
  p_meta_description TEXT DEFAULT NULL
)
RETURNS seo_page_versions
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_version INTEGER;
  v_result seo_page_versions;
BEGIN
  -- Lock existing versions for this page to prevent concurrent reads
  PERFORM 1
  FROM seo_page_versions
  WHERE page_id = p_page_id
  FOR UPDATE;

  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM seo_page_versions
  WHERE page_id = p_page_id;

  -- Insert and return the new version
  INSERT INTO seo_page_versions (page_id, version_number, content, meta_title, meta_description)
  VALUES (p_page_id, v_next_version, p_content, p_meta_title, p_meta_description)
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
