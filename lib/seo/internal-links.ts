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

        // Parse current slug to extract service and city
        let currentService = ''
        let currentCity = ''
        for (const svc of services) {
          for (const c of cities) {
            if (`${svc.slug}-${c.slug}` === slug) {
              currentService = svc.slug
              currentCity = c.slug
              break
            }
          }
          if (currentService) break
        }

        if (!currentService || !currentCity) break

        const sameService: InternalLink[] = []
        const sameCity: InternalLink[] = []

        for (const page of data) {
          let pageService = ''
          let pageCity = ''
          for (const svc of services) {
            for (const c of cities) {
              if (`${svc.slug}-${c.slug}` === page.slug) {
                pageService = svc.slug
                pageCity = c.slug
                break
              }
            }
            if (pageService) break
          }

          if (pageService === currentService && pageCity !== currentCity && sameService.length < 3) {
            const serviceName = services.find(s => s.slug === currentService)?.name ?? currentService
            sameService.push({
              title: page.meta_title,
              href: `/services/${pageService}/${pageCity}`,
              group: `More ${serviceName} pages`,
            })
          }
          if (pageCity === currentCity && pageService !== currentService && sameCity.length < 3) {
            const cityName = cities.find(c => c.slug === currentCity)?.name ?? currentCity
            sameCity.push({
              title: page.meta_title,
              href: `/services/${pageService}/${pageCity}`,
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

        // Parse current slug
        let currentIndustry = ''
        let currentCity = ''
        for (const ind of industries) {
          for (const c of cities) {
            if (`industry-${ind.slug}-${c.slug}` === slug) {
              currentIndustry = ind.slug
              currentCity = c.slug
              break
            }
          }
          if (currentIndustry) break
        }

        if (!currentIndustry || !currentCity) break

        const sameIndustry: InternalLink[] = []
        const sameCity: InternalLink[] = []

        for (const page of data) {
          if (page.route_pattern === 'industries-city') {
            for (const ind of industries) {
              for (const c of cities) {
                if (`industry-${ind.slug}-${c.slug}` === page.slug) {
                  if (ind.slug === currentIndustry && c.slug !== currentCity && sameIndustry.length < 3) {
                    const industryName = industries.find(i => i.slug === currentIndustry)?.name ?? currentIndustry
                    sameIndustry.push({
                      title: page.meta_title,
                      href: `/industries/${ind.slug}/${c.slug}`,
                      group: `More ${industryName} pages`,
                    })
                  }
                  if (c.slug === currentCity && ind.slug !== currentIndustry && sameCity.length < 3) {
                    const cityName = cities.find(ct => ct.slug === currentCity)?.name ?? currentCity
                    sameCity.push({
                      title: page.meta_title,
                      href: `/industries/${ind.slug}/${c.slug}`,
                      group: `More in ${cityName}`,
                    })
                  }
                  break
                }
              }
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
