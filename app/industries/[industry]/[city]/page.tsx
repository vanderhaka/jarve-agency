import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPage, getPublishedSlugs, parseContent, buildFaqJsonLd } from '@/lib/seo/queries'
import { industries } from '@/lib/seo/industries'
import { cities } from '@/lib/seo/cities'
import { Breadcrumbs, SeoPageSections, InternalLinksSection } from '@/lib/seo/components'
import { getRelatedPages } from '@/lib/seo/internal-links'

interface Props {
  params: Promise<{ industry: string; city: string }>
}

function buildSlug(industry: string, city: string) {
  return `industry-${industry}-${city}`
}

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('industries-city')
  return slugs.map((slug) => {
    for (const ind of industries) {
      for (const c of cities) {
        if (buildSlug(ind.slug, c.slug) === slug) {
          return { industry: ind.slug, city: c.slug }
        }
      }
    }
    return null
  }).filter(Boolean)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry, city } = await params
  const page = await getPublishedPage(buildSlug(industry, city))
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

export default async function IndustryCityPage({ params }: Props) {
  const { industry, city } = await params
  const page = await getPublishedPage(buildSlug(industry, city))
  if (!page) notFound()

  const content = parseContent(page)
  const relatedLinks = await getRelatedPages(page.slug, page.route_pattern)
  const industryData = industries.find((i) => i.slug === industry)
  const cityData = cities.find((c) => c.slug === city)

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
    areaServed: {
      '@type': 'City',
      name: cityData?.name ?? city,
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
            { label: industryData?.name ?? industry, href: `/industries/${industry}` },
            { label: cityData?.name ?? city },
          ]}
        />
      </div>
      <SeoPageSections content={content} />
      <InternalLinksSection links={relatedLinks} />
    </div>
  )
}
