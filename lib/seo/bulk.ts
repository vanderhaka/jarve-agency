import { createAdminClient } from '@/utils/supabase/admin'
import { refreshPageContent } from './refresh'
import { revalidatePath } from 'next/cache'

interface BulkResult {
  success: number
  failed: number
  errors: string[]
}

export async function bulkPublish(ids: string[]): Promise<BulkResult> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('seo_pages')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('status', 'draft')

  if (error) {
    return { success: 0, failed: ids.length, errors: [error.message] }
  }

  const { count } = await supabase
    .from('seo_pages')
    .select('*', { count: 'exact', head: true })
    .in('id', ids)
    .eq('status', 'published')

  revalidatePath('/sitemap.xml')

  const success = count ?? 0
  return { success, failed: ids.length - success, errors: [] }
}

export async function bulkUnpublish(ids: string[]): Promise<BulkResult> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('seo_pages')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('status', 'published')

  if (error) {
    return { success: 0, failed: ids.length, errors: [error.message] }
  }

  const { count } = await supabase
    .from('seo_pages')
    .select('*', { count: 'exact', head: true })
    .in('id', ids)
    .eq('status', 'draft')

  revalidatePath('/sitemap.xml')

  return { success: count ?? 0, failed: ids.length - (count ?? 0), errors: [] }
}

export async function bulkDelete(ids: string[]): Promise<BulkResult> {
  const supabase = createAdminClient()

  const { error, count } = await supabase
    .from('seo_pages')
    .delete()
    .in('id', ids)

  if (error) {
    return { success: 0, failed: ids.length, errors: [error.message] }
  }

  revalidatePath('/sitemap.xml')

  return { success: count ?? ids.length, failed: 0, errors: [] }
}

export async function bulkRefresh(ids: string[]): Promise<BulkResult> {
  const errors: string[] = []
  let success = 0

  for (const id of ids) {
    const result = await refreshPageContent(id)
    if (result.success) {
      success++
    } else {
      errors.push(result.error || `Failed to refresh ${id}`)
    }
  }

  return { success, failed: ids.length - success, errors }
}
