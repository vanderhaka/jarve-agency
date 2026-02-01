import { createAdminClient } from '@/utils/supabase/admin'
import { createVersion } from './versioning'
import { revalidatePath } from 'next/cache'

export async function schedulePage(
  pageId: string,
  publishAt: Date
): Promise<boolean> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('seo_pages')
    .update({ scheduled_publish_at: publishAt.toISOString() })
    .eq('id', pageId)
    .eq('status', 'draft')

  if (error) {
    console.error('Failed to schedule page:', error)
    return false
  }

  return true
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
    .select('id, slug, content, meta_title, meta_description')
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
      await createVersion(
        page.id,
        page.content as Record<string, unknown>,
        page.meta_title,
        page.meta_description
      )

      await supabase
        .from('seo_pages')
        .update({
          status: 'published',
          scheduled_publish_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', page.id)

      published++
    } catch (err) {
      errors.push(`${page.slug}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (published > 0) {
    revalidatePath('/sitemap.xml')
  }

  return { published, errors }
}
