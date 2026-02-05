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

  const { data, error } = await supabase
    .from('seo_pages')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('status', 'draft')
    .select('id')

  if (error) {
    return { success: 0, failed: ids.length, errors: [error.message] }
  }

  revalidatePath('/sitemap.xml')

  const success = data?.length ?? 0
  return { success, failed: ids.length - success, errors: [] }
}

export async function bulkUnpublish(ids: string[]): Promise<BulkResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seo_pages')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .in('id', ids)
    .eq('status', 'published')
    .select('id')

  if (error) {
    return { success: 0, failed: ids.length, errors: [error.message] }
  }

  revalidatePath('/sitemap.xml')

  const success = data?.length ?? 0
  return { success, failed: ids.length - success, errors: [] }
}

export async function bulkDelete(ids: string[]): Promise<BulkResult> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seo_pages')
    .delete()
    .in('id', ids)
    .select('id')

  if (error) {
    return { success: 0, failed: ids.length, errors: [error.message] }
  }

  revalidatePath('/sitemap.xml')

  const success = data?.length ?? 0
  return { success, failed: ids.length - success, errors: [] }
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
