import { createAdminClient } from '@/utils/supabase/admin'

export interface PageVersion {
  id: string
  page_id: string
  version_number: number
  content: Record<string, unknown>
  meta_title: string | null
  meta_description: string | null
  created_at: string
}

export async function createVersion(
  pageId: string,
  content: Record<string, unknown>,
  metaTitle: string,
  metaDescription: string
): Promise<PageVersion | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('create_page_version', {
    p_page_id: pageId,
    p_content: content,
    p_meta_title: metaTitle,
    p_meta_description: metaDescription,
  })

  if (error) {
    console.error('Failed to create version:', error)
    return null
  }

  return data
}

export async function getVersionHistory(
  pageId: string,
  limit = 20,
  offset = 0
): Promise<PageVersion[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seo_page_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch version history:', error)
    return []
  }

  return data || []
}

export async function getVersion(
  pageId: string,
  versionNumber: number
): Promise<PageVersion | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seo_page_versions')
    .select('*')
    .eq('page_id', pageId)
    .eq('version_number', versionNumber)
    .single()

  if (error) {
    console.error('Failed to fetch version:', error)
    return null
  }

  return data
}

export async function getLatestVersion(pageId: string): Promise<PageVersion | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seo_page_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Failed to fetch latest version:', error)
    return null
  }

  return data
}
