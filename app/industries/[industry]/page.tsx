import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPage, getPublishedSlugs, parseContent } from '@/lib/seo/queries'
import { industries } from '@/lib/seo/industries'
import { Breadcrumbs, SeoPageSections } from '@/lib/seo/components'

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
  return {
    title: page.meta_title,
    description: page.meta_description,
  }
}

export default async function IndustryPage({ params }: Props) {
  const { industry } = await params
  const page = await getPublishedPage(buildSlug(industry))
  if (!page) notFound()

  const content = parseContent(page)
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
            { label: 'Industries' },
            { label: industryData?.name ?? industry },
          ]}
        />
      </div>
      <SeoPageSections content={content} />
    </div>
  )
}
