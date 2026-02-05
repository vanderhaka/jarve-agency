import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cities } from '@/lib/seo/cities'
import { services } from '@/lib/seo/services'
import { industries } from '@/lib/seo/industries'
import { Breadcrumbs } from '@/components/seo/components'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/fade-in'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jarve.com.au'

interface Props {
  params: Promise<{ city: string }>
}

export async function generateStaticParams() {
  return cities.map((city) => ({
    city: city.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params
  const cityData = cities.find((c) => c.slug === city)
  if (!cityData) return {}

  const title = `Custom Software Development in ${cityData.name} | Jarve`
  const description = `Custom software, web apps, and business automation in ${cityData.name}, ${cityData.state}. ${cityData.tier === 1 ? 'Major tech hub' : 'Growing tech community'} serving local businesses.`

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

export default async function CityHubPage({ params }: Props) {
  const { city } = await params
  const cityData = cities.find((c) => c.slug === city)
  if (!cityData) notFound()

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
        name: 'Cities',
        item: `${BASE_URL}/cities`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityData.name,
        item: `${BASE_URL}/cities/${cityData.slug}`,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container mx-auto px-4 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Cities', href: '/' },
            { label: cityData.name },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="container mx-auto px-4 max-w-5xl relative">
          <FadeIn>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Custom Software Development in {cityData.name}
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
              {cityData.tier === 1
                ? `Building web apps and custom software for ${cityData.name}'s growing tech ecosystem.`
                : `Helping ${cityData.name} businesses with web apps, automation, and custom software.`}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* City Context */}
      <section className="py-12 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              About {cityData.name}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              {cityData.localDetails}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Services Available */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
              Services in {cityData.name}
            </h2>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <FadeIn key={service.slug} delay={0.1 + i * 0.05}>
                <Link href={`/services/${service.slug}/${cityData.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium">Price:</span> {service.priceRange}
                        </p>
                        <p>
                          <span className="font-medium">Timeline:</span> {service.timeline}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
              Industries We Serve in {cityData.name}
            </h2>
          </FadeIn>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, i) => (
              <FadeIn key={industry.slug} delay={0.1 + i * 0.05}>
                <Link href={`/industries/${industry.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg">{industry.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Custom software for {industry.name.toLowerCase()} businesses in {cityData.name}
                      </CardDescription>
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
