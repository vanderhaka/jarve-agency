import { createAnonClient } from '@/utils/supabase/anon'

export interface InternalLink {
  title: string
  href: string
  group: string
}

export async function getRelatedPages(slug: string, routePattern: string): Promise<InternalLink[]> {
  const supabase = createAnonClient()
  const links: InternalLink[] = []

  try {
    switch (routePattern) {
      case 'services-city': {
        const { data } = await supabase
          .from('seo_pages')
          .select('slug, meta_title')
          .eq('route_pattern', 'services-city')
          .eq('status', 'published')
          .neq('slug', slug)

        if (!data) break

        const { services } = await import('./services')
        const { cities } = await import('./cities')

        // Build slug -> {service, city} lookup map (O(s*c) once instead of O(s*c*n))
        const slugMap = new Map<string, { service: string; city: string }>()
        for (const svc of services) {
          for (const c of cities) {
            slugMap.set(`${svc.slug}-${c.slug}`, { service: svc.slug, city: c.slug })
          }
        }

        const current = slugMap.get(slug)
        if (!current) break

        const sameService: InternalLink[] = []
        const sameCity: InternalLink[] = []

        for (const page of data) {
          const parsed = slugMap.get(page.slug)
          if (!parsed) continue

          if (parsed.service === current.service && parsed.city !== current.city && sameService.length < 3) {
            const serviceName = services.find(s => s.slug === current.service)?.name ?? current.service
            sameService.push({
              title: page.meta_title,
              href: `/services/${parsed.service}/${parsed.city}`,
              group: `More ${serviceName} pages`,
            })
          }
          if (parsed.city === current.city && parsed.service !== current.service && sameCity.length < 3) {
            const cityName = cities.find(c => c.slug === current.city)?.name ?? current.city
            sameCity.push({
              title: page.meta_title,
              href: `/services/${parsed.service}/${parsed.city}`,
              group: `More in ${cityName}`,
            })
          }
        }

        links.push(...sameService, ...sameCity)
        break
      }

      case 'industries': {
        const { data } = await supabase
          .from('seo_pages')
          .select('slug, meta_title, route_pattern')
          .in('route_pattern', ['industries', 'industries-city'])
          .eq('status', 'published')
          .neq('slug', slug)
          .limit(6)

        if (!data) break

        const { industries } = await import('./industries')
        const { cities } = await import('./cities')

        for (const page of data) {
          let href = ''
          if (page.route_pattern === 'industries') {
            const industrySlug = page.slug.replace('industry-', '')
            href = `/industries/${industrySlug}`
          } else {
            // industries-city: industry-{industry}-{city}
            for (const ind of industries) {
              for (const c of cities) {
                if (`industry-${ind.slug}-${c.slug}` === page.slug) {
                  href = `/industries/${ind.slug}/${c.slug}`
                  break
                }
              }
              if (href) break
            }
          }

          if (href) {
            links.push({
              title: page.meta_title,
              href,
              group: 'Related industries',
            })
          }
        }
        break
      }

      case 'industries-city': {
        const { data } = await supabase
          .from('seo_pages')
          .select('slug, meta_title, route_pattern')
          .in('route_pattern', ['industries', 'industries-city'])
          .eq('status', 'published')
          .neq('slug', slug)

        if (!data) break

        const { industries } = await import('./industries')
        const { cities } = await import('./cities')

        // Build slug -> {industry, city} lookup map
        const indCityMap = new Map<string, { industry: string; city: string }>()
        for (const ind of industries) {
          for (const c of cities) {
            indCityMap.set(`industry-${ind.slug}-${c.slug}`, { industry: ind.slug, city: c.slug })
          }
        }

        const current = indCityMap.get(slug)
        if (!current) break

        const sameIndustry: InternalLink[] = []
        const sameCity: InternalLink[] = []

        for (const page of data) {
          if (page.route_pattern === 'industries-city') {
            const parsed = indCityMap.get(page.slug)
            if (!parsed) continue

            if (parsed.industry === current.industry && parsed.city !== current.city && sameIndustry.length < 3) {
              const industryName = industries.find(i => i.slug === current.industry)?.name ?? current.industry
              sameIndustry.push({
                title: page.meta_title,
                href: `/industries/${parsed.industry}/${parsed.city}`,
                group: `More ${industryName} pages`,
              })
            }
            if (parsed.city === current.city && parsed.industry !== current.industry && sameCity.length < 3) {
              const cityName = cities.find(ct => ct.slug === current.city)?.name ?? current.city
              sameCity.push({
                title: page.meta_title,
                href: `/industries/${parsed.industry}/${parsed.city}`,
                group: `More in ${cityName}`,
              })
            }
          }
        }

        links.push(...sameIndustry, ...sameCity)
        break
      }

      case 'solutions': {
        const { data } = await supabase
          .from('seo_pages')
          .select('slug, meta_title')
          .eq('route_pattern', 'solutions')
          .eq('status', 'published')
          .neq('slug', slug)
          .limit(6)

        if (!data) break

        for (const page of data) {
          links.push({
            title: page.meta_title,
            href: `/solutions/${page.slug.replace('solution-', '')}`,
            group: 'Related solutions',
          })
        }
        break
      }

      case 'comparisons': {
        const { data } = await supabase
          .from('seo_pages')
          .select('slug, meta_title')
          .eq('route_pattern', 'comparisons')
          .eq('status', 'published')
          .neq('slug', slug)
          .limit(6)

        if (!data) break

        for (const page of data) {
          links.push({
            title: page.meta_title,
            href: `/compare/${page.slug.replace('compare-', '')}`,
            group: 'More comparisons',
          })
        }
        break
      }
    }
  } catch (error) {
    console.error('Error fetching related pages:', error)
  }

  return links
}
