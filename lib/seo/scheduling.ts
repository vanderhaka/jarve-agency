import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function schedulePage(
  pageId: string,
  publishAt: Date
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Verify page exists and is a draft
  const { data: page } = await supabase
    .from('seo_pages')
    .select('id, status')
    .eq('id', pageId)
    .single()

  if (!page) return { success: false, error: 'Page not found' }
  if (page.status !== 'draft') return { success: false, error: 'Only draft pages can be scheduled' }

  const { error } = await supabase
    .from('seo_pages')
    .update({ scheduled_publish_at: publishAt.toISOString() })
    .eq('id', pageId)

  if (error) {
    console.error('Failed to schedule page:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function unschedulePage(pageId: string): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('seo_pages')
    .update({ scheduled_publish_at: null })
    .eq('id', pageId)

  if (error) {
    console.error('Failed to unschedule page:', error)
    return false
  }

  return true
}

/**
 * Publish all pages whose scheduled_publish_at is in the past.
 * Called by the seo-drip cron before drip logic.
 */
export async function publishScheduledPages(): Promise<{
  published: number
  errors: string[]
}> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: duePages } = await supabase
    .from('seo_pages')
    .select('id, slug')
    .eq('status', 'draft')
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', now)

  if (!duePages || duePages.length === 0) {
    return { published: 0, errors: [] }
  }

  let published = 0
  const errors: string[] = []

  for (const page of duePages) {
    try {
      // Atomic version creation + status update via DB function
      const { data, error: rpcError } = await supabase.rpc('publish_page', {
        p_page_id: page.id,
      })

      if (rpcError) {
        errors.push(`${page.slug}: ${rpcError.message}`)
        continue
      }

      const result = data as { success: boolean; error?: string }
      if (!result.success) {
        errors.push(`${page.slug}: ${result.error}`)
        continue
      }

      published++
    } catch (err) {
      errors.push(`${page.slug}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (published > 0) {
    revalidatePath('/sitemap.xml')
  }

  return { published, errors }
}
