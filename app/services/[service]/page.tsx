import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { services } from '@/lib/seo/services'
import { cities, tier1Cities, tier2Cities } from '@/lib/seo/cities'
import { Breadcrumbs } from '@/lib/seo/components'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/fade-in'
import { Check } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jarve.com.au'

interface Props {
  params: Promise<{ service: string }>
}

export async function generateStaticParams() {
  return services.map((service) => ({
    service: service.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service } = await params
  const serviceData = services.find((s) => s.slug === service)
  if (!serviceData) return {}

  const title = `${serviceData.name} Australia | Jarve`
  const description = `${serviceData.description} Available across all major Australian cities. ${serviceData.priceRange}, ${serviceData.timeline}.`

  const ogTitle = encodeURIComponent(title)
  const ogDesc = encodeURIComponent(description)

  return {
    title,
    description,
    openGraph: {
      images: [`/api/og?title=${ogTitle}&description=${ogDesc}`],
    },
  }
}

export default async function ServiceHubPage({ params }: Props) {
  const { service } = await params
  const serviceData = services.find((s) => s.slug === service)
  if (!serviceData) notFound()

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceData.name,
    description: serviceData.description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Jarve',
      url: BASE_URL,
    },
    offers: {
      '@type': 'Offer',
      priceRange: serviceData.priceRange,
      availability: 'https://schema.org/InStock',
    },
    areaServed: cities.map((city) => ({
      '@type': 'City',
      name: city.name,
      addressRegion: city.state,
      addressCountry: 'AU',
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: `${BASE_URL}/#services`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: serviceData.name,
        item: `${BASE_URL}/services/${serviceData.slug}`,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/#services' },
            { label: serviceData.name },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="container mx-auto px-4 max-w-5xl relative">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {serviceData.name}
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
              {serviceData.description}
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-6 text-lg">
              <div>
                <span className="text-muted-foreground">Price Range:</span>
                <span className="ml-2 font-semibold">{serviceData.priceRange}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Timeline:</span>
                <span className="ml-2 font-semibold">{serviceData.timeline}</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
              What&apos;s Included
            </h2>
          </FadeIn>
          <div className="grid gap-4 md:grid-cols-2 max-w-3xl">
            {serviceData.keyFeatures.map((feature, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.05}>
                <div className="flex gap-3">
                  <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-lg text-muted-foreground">{feature}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Typical Client */}
      <section className="py-20 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Who This Is For
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {serviceData.typicalClient}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Available Cities - Tier 1 */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
              {serviceData.name} in Major Cities
            </h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tier1Cities.map((city, i) => (
              <FadeIn key={city.slug} delay={0.1 + i * 0.05}>
                <Link href={`/services/${serviceData.slug}/${city.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {city.name}, {city.state}
                      </CardTitle>
                      <CardDescription>
                        {serviceData.name} in {city.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {city.keywords.join(', ')}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Available Cities - Tier 2 */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
              Also Available In
            </h2>
          </FadeIn>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {tier2Cities.map((city, i) => (
              <FadeIn key={city.slug} delay={0.1 + i * 0.05}>
                <Link href={`/services/${serviceData.slug}/${city.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {city.name}, {city.state}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
