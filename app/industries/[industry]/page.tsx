import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPage, getPublishedSlugs, parseContent, buildFaqJsonLd } from '@/lib/seo/queries'
import { industries } from '@/lib/seo/industries'
import { Breadcrumbs, SeoPageSections, InternalLinksSection } from '@/lib/seo/components'
import { getRelatedPages } from '@/lib/seo/internal-links'

interface Props {
  params: Promise<{ industry: string }>
}

function buildSlug(industry: string) {
  return `industry-${industry}`
}

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('industries')
  return slugs.map((slug) => ({
    industry: slug.replace('industry-', ''),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry } = await params
  const page = await getPublishedPage(buildSlug(industry))
  if (!page) return {}
  const ogTitle = encodeURIComponent(page.meta_title)
  const ogDesc = encodeURIComponent(page.meta_description)
  return {
    title: page.meta_title,
    description: page.meta_description,
    openGraph: {
      images: [`/api/og?title=${ogTitle}&description=${ogDesc}`],
    },
  }
}

export default async function IndustryPage({ params }: Props) {
  const { industry } = await params
  const page = await getPublishedPage(buildSlug(industry))
  if (!page) notFound()

  const content = parseContent(page)
  const relatedLinks = await getRelatedPages(page.slug, page.route_pattern)
  const industryData = industries.find((i) => i.slug === industry)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${industryData?.name ?? industry} Software Development`,
    description: page.meta_description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Jarve',
      url: 'https://jarve.com.au',
    },
  }

  const faqJsonLd = buildFaqJsonLd(content)

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Industries' },
            { label: industryData?.name ?? industry },
          ]}
        />
      </div>
      <SeoPageSections content={content} />
      <InternalLinksSection links={relatedLinks} />
    </div>
  )
}
