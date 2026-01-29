import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPage, getPublishedSlugs, parseContent } from '@/lib/seo/queries'
import { comparisons } from '@/lib/seo/comparisons'
import { Breadcrumbs, SeoPageSections } from '@/lib/seo/components'

interface Props {
  params: Promise<{ tool: string }>
}

function buildSlug(tool: string) {
  return `compare-${tool}`
}

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('comparisons')
  return slugs.map((slug) => ({
    tool: slug.replace('compare-', ''),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params
  const page = await getPublishedPage(buildSlug(tool))
  if (!page) return {}
  return {
    title: page.meta_title,
    description: page.meta_description,
  }
}

export default async function ComparisonPage({ params }: Props) {
  const { tool } = await params
  const page = await getPublishedPage(buildSlug(tool))
  if (!page) notFound()

  const content = parseContent(page)
  const compData = comparisons.find((c) => c.slug === tool)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Custom Software vs ${compData?.tool ?? tool}`,
    description: page.meta_description,
    publisher: {
      '@type': 'LocalBusiness',
      name: 'Jarve',
      url: 'https://jarve.com.au',
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Compare' },
            { label: `vs ${compData?.tool ?? tool}` },
          ]}
        />
      </div>
      <SeoPageSections content={content} />
    </div>
  )
}
