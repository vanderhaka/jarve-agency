import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedPage, getPublishedSlugs, parseContent, buildFaqJsonLd } from '@/lib/seo/queries'
import { solutions } from '@/lib/seo/solutions'
import { Breadcrumbs, SeoPageSections } from '@/lib/seo/components'

interface Props {
  params: Promise<{ problem: string }>
}

function buildSlug(problem: string) {
  return `solution-${problem}`
}

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs('solutions')
  return slugs.map((slug) => ({
    problem: slug.replace('solution-', ''),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { problem } = await params
  const page = await getPublishedPage(buildSlug(problem))
  if (!page) return {}
  return {
    title: page.meta_title,
    description: page.meta_description,
  }
}

export default async function SolutionPage({ params }: Props) {
  const { problem } = await params
  const page = await getPublishedPage(buildSlug(problem))
  if (!page) notFound()

  const content = parseContent(page)
  const solutionData = solutions.find((s) => s.slug === problem)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: solutionData?.problem ?? problem,
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
            { label: 'Solutions' },
            { label: solutionData?.problem ?? problem },
          ]}
        />
      </div>
      <SeoPageSections content={content} />
    </div>
  )
}
