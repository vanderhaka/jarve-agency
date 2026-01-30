import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPage, getPublishedSlugs, parseContent, buildFaqJsonLd } from '@/lib/seo/queries'
import { services } from '@/lib/seo/services'
import { cities } from '@/lib/seo/cities'
import { Breadcrumbs, SeoPageSections, InternalLinksSection } from '@/lib/seo/components'
import { getRelatedPages } from '@/lib/seo/internal-links'

interface Props {
  params: Promise<{ service: string; city: string }>
}

function buildSlug(service: string, city: string) {
  return `${service}-${city}`
}

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('services-city')
  return slugs.map((slug) => {
    // Find matching service and city from the slug
    for (const svc of services) {
      for (const c of cities) {
        if (buildSlug(svc.slug, c.slug) === slug) {
          return { service: svc.slug, city: c.slug }
        }
      }
    }
    return null
  }).filter(Boolean)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service, city } = await params
  const page = await getPublishedPage(buildSlug(service, city))
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

export default async function ServiceCityPage({ params }: Props) {
  const { service, city } = await params
  const page = await getPublishedPage(buildSlug(service, city))
  if (!page) notFound()

  const content = parseContent(page)
  const relatedLinks = await getRelatedPages(page.slug, page.route_pattern)
  const serviceData = services.find((s) => s.slug === service)
  const cityData = cities.find((c) => c.slug === city)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceData?.name ?? service,
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
            { label: 'Services', href: '/#services' },
            { label: serviceData?.name ?? service, href: `/services/${service}/${cities[0]?.slug}` },
            { label: cityData?.name ?? city },
          ]}
        />
      </div>
      <SeoPageSections content={content} />
      <InternalLinksSection links={relatedLinks} />
    </div>
  )
}
