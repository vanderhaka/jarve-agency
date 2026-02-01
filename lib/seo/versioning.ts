import { createClient } from '@/utils/supabase/server'

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
  const supabase = await createClient()

  // Get the highest version number for this page
  const { data: lastVersion } = await supabase
    .from('seo_page_versions')
    .select('version_number')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = lastVersion ? lastVersion.version_number + 1 : 1

  // Insert new version
  const { data, error } = await supabase
    .from('seo_page_versions')
    .insert({
      page_id: pageId,
      version_number: nextVersion,
      content,
      meta_title: metaTitle,
      meta_description: metaDescription,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create version:', error)
    return null
  }

  return data
}

export async function getVersionHistory(pageId: string): Promise<PageVersion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seo_page_versions')
    .select('*')
    .eq('page_id', pageId)
    .order('version_number', { ascending: false })

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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
