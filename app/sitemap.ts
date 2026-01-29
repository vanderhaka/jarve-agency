import type { MetadataRoute } from 'next'
import { getAllPublishedPages } from '@/lib/seo/queries'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jarve.com.au'

function slugToPath(slug: string, routePattern: string): string {
  switch (routePattern) {
    case 'services-city': {
      // slug format: "service-slug-city-slug" - need to find the split point
      // Services have known slugs, so match from the start
      const servicesSlugs = [
        'mvp-development', 'web-app-development', 'custom-software-development',
        'internal-tools', 'startup-app-development', 'business-automation',
      ]
      for (const svc of servicesSlugs) {
        if (slug.startsWith(`${svc}-`)) {
          const city = slug.slice(svc.length + 1)
          return `/services/${svc}/${city}`
        }
      }
      return `/services/${slug}`
    }
    case 'industries':
      return `/industries/${slug.replace('industry-', '')}`
    case 'industries-city': {
      // slug format: "industry-{industry}-{city}"
      const withoutPrefix = slug.replace('industry-', '')
      // Find city by checking known city slugs at the end
      const citySlugs = [
        'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide',
        'gold-coast', 'canberra', 'newcastle', 'wollongong', 'hobart',
        'geelong', 'sunshine-coast', 'townsville', 'cairns', 'darwin',
      ]
      for (const city of citySlugs) {
        if (withoutPrefix.endsWith(`-${city}`)) {
          const industry = withoutPrefix.slice(0, -(city.length + 1))
          return `/industries/${industry}/${city}`
        }
      }
      return `/industries/${withoutPrefix}`
    }
    case 'solutions':
      return `/solutions/${slug.replace('solution-', '')}`
    case 'comparisons':
      return `/compare/${slug.replace('compare-', '')}`
    default:
      return `/${slug}`
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ]

  const seoPages = await getAllPublishedPages()
  const dynamicPages: MetadataRoute.Sitemap = seoPages.map((page) => ({
    url: `${BASE_URL}${slugToPath(page.slug, page.route_pattern)}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...dynamicPages]
}
