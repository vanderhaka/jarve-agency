# pSEO Strategy for JARVE — Local SEO Focus

## Executive Summary

JARVE is a custom web development agency (jarve.com.au) offering MVPs, web applications, and internal tools. This document outlines a programmatic SEO (pSEO) strategy with emphasis on **local SEO** to capture Australian business owners searching for development services in their area.

---

## Current State

### Existing Pages
- Homepage (/)
- Case studies: `/work/blurbbuddy`, `/work/diggable`
- Portal/app pages (not indexed)

### SEO Infrastructure
- Basic `robots.ts` in place
- No sitemap.ts
- No structured data (JSON-LD)
- No local SEO pages

---

## pSEO Opportunity Analysis

### 1. Local SEO Pages (Highest Priority)

Australian businesses often search with location modifiers. These are high-intent, lower-competition searches.

#### Pattern: `/services/[service]/[city]`

**Target Cities (by population & business density):**
- Tier 1: Sydney, Melbourne, Brisbane, Perth, Adelaide
- Tier 2: Gold Coast, Newcastle, Canberra, Wollongong, Hobart
- Tier 3: Geelong, Townsville, Cairns, Darwin, Toowoomba

**Target Services:**
- MVP Development
- Web App Development  
- Custom Software Development
- Internal Tools / Admin Dashboards
- Startup App Development
- Business Automation

**Example URLs:**
```
/services/mvp-development/sydney
/services/web-app-development/melbourne
/services/custom-software/brisbane
/services/internal-tools/perth
/services/business-automation/adelaide
```

**Estimated Pages:** 6 services × 15 cities = **90 pages**

---

### 2. Industry-Specific Landing Pages

#### Pattern: `/industries/[industry]`

**Target Industries (Australia focus):**
- Construction & Trades
- Real Estate & Property Management
- Legal & Law Firms
- Healthcare & Allied Health
- Mining & Resources
- Agriculture
- Hospitality & Tourism
- Professional Services (Accounting, Consulting)
- Logistics & Transport
- Retail & E-commerce
- Education & Training
- Manufacturing

**Example URLs:**
```
/industries/construction
/industries/real-estate
/industries/legal
/industries/healthcare
/industries/mining
```

**Estimated Pages:** **12 pages**

---

### 3. Industry + Location Combination (High Value)

#### Pattern: `/industries/[industry]/[city]`

Cross-reference top industries with tier-1 cities only.

**Example URLs:**
```
/industries/construction/sydney
/industries/real-estate/melbourne
/industries/mining/perth
/industries/legal/brisbane
```

**Estimated Pages:** 12 industries × 5 cities = **60 pages**

---

### 4. Use Case / Problem Pages

#### Pattern: `/solutions/[problem]`

Target pain points businesses search for:
- Replace Spreadsheets with Custom Software
- Automate Manual Business Processes
- Build Customer Portal
- Create Staff Scheduling System
- Inventory Management Software
- Job Management Software
- Client Portal Development
- Quote & Proposal Software
- Project Management Tool
- CRM Development
- Booking System Development

**Example URLs:**
```
/solutions/replace-spreadsheets
/solutions/automate-manual-processes
/solutions/customer-portal
/solutions/job-management-software
/solutions/inventory-management
```

**Estimated Pages:** **15 pages**

---

### 5. Comparison / Alternative Pages

#### Pattern: `/compare/[tool]` or `/alternatives/[tool]`

Target people looking to replace off-the-shelf tools:
- Custom [Tool] Alternative
- Build Your Own [Tool]

**Example Tools:**
- Monday.com alternative
- Airtable alternative
- Notion alternative
- Tradify alternative
- ServiceM8 alternative
- Jobber alternative

**Estimated Pages:** **10 pages**

---

## Total Page Estimates

| Category | Pages |
|----------|-------|
| Service + City | 90 |
| Industries | 12 |
| Industry + City | 60 |
| Solutions/Problems | 15 |
| Comparisons | 10 |
| **Total** | **187 pages** |

---

## Implementation Architecture

### Recommended Folder Structure

```
app/
├── services/
│   └── [service]/
│       └── [city]/
│           └── page.tsx        # Dynamic service+city page
│
├── industries/
│   ├── [industry]/
│   │   └── page.tsx            # Industry page
│   └── [industry]/
│       └── [city]/
│           └── page.tsx        # Industry+city page
│
├── solutions/
│   └── [problem]/
│       └── page.tsx            # Solution page
│
├── compare/
│   └── [tool]/
│       └── page.tsx            # Comparison page
│
└── sitemap.ts                  # Dynamic sitemap
```

### Data Structure

Create a `lib/seo/` directory with configuration files:

```typescript
// lib/seo/cities.ts
export const cities = [
  { 
    slug: 'sydney',
    name: 'Sydney',
    state: 'NSW',
    region: 'Greater Sydney',
    population: '5.3M',
    businessFocus: ['tech', 'finance', 'professional-services']
  },
  { 
    slug: 'melbourne',
    name: 'Melbourne',
    state: 'VIC',
    region: 'Greater Melbourne',
    population: '5.0M',
    businessFocus: ['tech', 'manufacturing', 'retail']
  },
  // ... more cities
]

// lib/seo/services.ts
export const services = [
  {
    slug: 'mvp-development',
    title: 'MVP Development',
    shortTitle: 'MVP Development',
    description: 'Go from idea to working product in weeks',
    priceRange: '$5-12K',
    timeline: '2-4 weeks',
    icon: 'Rocket',
    keywords: ['mvp', 'minimum viable product', 'prototype', 'startup']
  },
  // ... more services
]

// lib/seo/industries.ts
export const industries = [
  {
    slug: 'construction',
    name: 'Construction & Trades',
    icon: 'HardHat',
    problems: [
      'Job scheduling chaos',
      'Paper-based quoting',
      'Lost project documentation',
      'Time tracking issues'
    ],
    solutions: [
      'Job management software',
      'Digital quoting systems',
      'Project documentation portals',
      'Mobile time tracking'
    ],
    relevantCities: ['sydney', 'melbourne', 'brisbane', 'perth']
  },
  // ... more industries
]
```

---

## Page Templates

### Service + City Page Template (Complete Specification)

**URL:** `/services/mvp-development/sydney`
**Title:** `MVP Development Sydney | Launch Your Startup Fast | JARVE`
**H1:** Generated `heroHeadline`

#### Full Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                     │
│  - Logo (links to /)                                        │
│  - Navigation: Services, Work, About, Contact               │
│  - CTA button                                               │
├─────────────────────────────────────────────────────────────┤
│  BREADCRUMBS                                                │
│  Home / Services / MVP Development / Sydney                 │
├─────────────────────────────────────────────────────────────┤
│  HERO SECTION                                               │
│  - H1: heroHeadline (generated)                             │
│  - Subheadline: heroSubheadline (generated)                 │
│  - Primary CTA button: ctaText (generated)                  │
│  - Optional: Hero image or illustration                     │
├─────────────────────────────────────────────────────────────┤
│  TRUST BAR                                                  │
│  - "5+ years experience"                                    │
│  - "50+ projects delivered"                                 │
│  - "Australian owned"                                       │
├─────────────────────────────────────────────────────────────┤
│  CITY CONTEXT SECTION                                       │
│  - cityContext paragraph (generated)                        │
│  - Subtle city-related visual (optional)                    │
├─────────────────────────────────────────────────────────────┤
│  PROBLEM / SOLUTION SECTION (Two columns on desktop)        │
│  - Left: "The Challenge" + problemStatement (generated)     │
│  - Right: "The Solution" + solutionOverview (generated)     │
├─────────────────────────────────────────────────────────────┤
│  BENEFITS SECTION                                           │
│  - Section title: "Why Choose JARVE for [Service]"          │
│  - 3-column grid of benefits (generated)                    │
│  - Each: icon + title + description                         │
├─────────────────────────────────────────────────────────────┤
│  TESTIMONIAL SECTION                                        │
│  - Single testimonial (matched via idealTestimonialMatch)   │
│  - Quote, name, company, optional photo                     │
│  - Fallback: best generic testimonial if no match           │
├─────────────────────────────────────────────────────────────┤
│  PRICING SECTION                                            │
│  - Price range: from service data ($5-12K)                  │
│  - Timeline: from service data (2-4 weeks)                  │
│  - What's included: from service features[]                 │
│  - CTA button                                               │
├─────────────────────────────────────────────────────────────┤
│  PROCESS SECTION (Shared component)                         │
│  - "How It Works"                                           │
│  - Step 1: Discovery call                                   │
│  - Step 2: Scoping & quote                                  │
│  - Step 3: Build with weekly demos                          │
│  - Step 4: Launch & support                                 │
├─────────────────────────────────────────────────────────────┤
│  FAQ SECTION                                                │
│  - 2 page-specific FAQs (generated)                         │
│  - 3-5 shared FAQs (from homepage component)                │
│  - Accordion format                                         │
├─────────────────────────────────────────────────────────────┤
│  FINAL CTA SECTION                                          │
│  - Headline: "Ready to build your [service]?"               │
│  - Subtext: "Book a free 15-minute call"                    │
│  - CTA button: ctaText (generated)                          │
│  - Link to /#contact or embedded Calendly                   │
├─────────────────────────────────────────────────────────────┤
│  INTERNAL LINKS SECTION                                     │
│  - "[Service] in Other Cities" - links to 4-5 nearby cities │
│  - "Other Services in [City]" - links to other services     │
│  - Helps SEO + user navigation                              │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                     │
│  - Shared component (already exists)                        │
└─────────────────────────────────────────────────────────────┘
```

#### Content Sources

| Section | Source | Generated/Shared/Static |
|---------|--------|------------------------|
| Breadcrumbs | Auto-generated from URL | Static logic |
| Hero headline | `heroHeadline` | Generated |
| Hero subheadline | `heroSubheadline` | Generated |
| Hero CTA | `ctaText` | Generated |
| Trust bar | Hardcoded values | Static |
| City context | `cityContext` | Generated |
| Problem statement | `problemStatement` | Generated |
| Solution overview | `solutionOverview` | Generated |
| Benefits | `benefits[]` | Generated |
| Testimonial | Matched via `idealTestimonialMatch` | Database lookup |
| Pricing | `service.priceRange`, `service.timeline` | Static data |
| Process | Shared component | Shared |
| Page FAQs | `faqs[]` | Generated |
| Shared FAQs | Homepage FAQ data | Shared |
| Final CTA | `ctaText` | Generated |
| Internal links | Auto-generated from data | Static logic |

### Industry Page Template

**URL:** `/industries/construction`
**Title:** `Software for Construction Companies | Custom Apps | JARVE`
**H1:** `Custom Software for Construction & Trades`

**Content Sections:**
1. Hero addressing industry pain points
2. "Common problems we solve" (industry-specific)
3. Solution examples with screenshots/mockups
4. Industry-specific features list
5. ROI calculator or case study
6. Pricing/CTA

### Solution/Problem Page Template

**URL:** `/solutions/replace-spreadsheets`
**Title:** `Replace Spreadsheets with Custom Software | JARVE`
**H1:** `Stop Using Spreadsheets for Everything`

**Content Sections:**
1. Problem agitation (pain of spreadsheets)
2. What custom software looks like
3. Before/after comparison
4. Cost comparison calculator
5. How we build it
6. CTA

---

## Image Strategy

### Service + City Pages

**Option 1: No unique images (Recommended to start)**
- Use shared service imagery across all city pages
- Hero: Abstract illustration or dashboard mockup
- Benefits: Icon set (Lucide icons work well)
- Fastest to implement, no visual debt

**Option 2: City hero images (Phase 2 enhancement)**
- City skyline or landmark photos
- Source: Unsplash (free, high-quality)
- Store in `/public/images/cities/[city-slug].jpg`
- Recommended size: 1920x600px (hero banner ratio)

**Suggested city images:**
```
/public/images/cities/
├── sydney.jpg      # Sydney Harbour / Opera House
├── melbourne.jpg   # Melbourne skyline / Flinders St
├── brisbane.jpg    # Brisbane River / Story Bridge
├── perth.jpg       # Perth CBD / Elizabeth Quay
├── adelaide.jpg    # Adelaide Oval / CBD
└── ... (add as needed)
```

### Industry Pages

**Unique images recommended:**
- Each industry should have a distinctive hero image
- Show the industry context (construction site, office, warehouse, etc.)
- Can use stock photos or AI-generated illustrations

```
/public/images/industries/
├── construction.jpg
├── real-estate.jpg
├── healthcare.jpg
├── legal.jpg
└── ...
```

### Image Optimization

- Use Next.js `<Image>` component for automatic optimization
- Implement blur placeholder for perceived performance
- Lazy load below-the-fold images

```tsx
<Image
  src={`/images/cities/${city.slug}.jpg`}
  alt={`${city.name} skyline`}
  width={1920}
  height={600}
  placeholder="blur"
  blurDataURL={city.blurDataUrl}
  priority={false}
/>
```

---

## Testimonial System

### Database Schema for Testimonials

```sql
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  
  -- Content
  quote text not null,
  author_name text not null,
  author_title text,           -- "Founder", "CEO", etc.
  company_name text,
  author_image_url text,
  
  -- Matching criteria
  city text,                   -- 'sydney', 'melbourne', etc. (nullable)
  industry text,               -- 'construction', 'fintech', etc. (nullable)
  service_type text,           -- 'mvp', 'web-app', etc. (nullable)
  tags text[],                 -- ['startup', 'b2b', 'saas'] for flexible matching
  
  -- Display
  featured boolean default false,  -- Show on homepage
  rating int,                      -- 1-5 stars (optional)
  
  -- Metadata
  project_id uuid references projects(id),
  created_at timestamptz default now()
);

-- Index for matching queries
create index idx_testimonials_matching 
  on testimonials(city, industry, service_type);
```

### Testimonial Matching Logic

```typescript
// lib/seo/testimonials.ts

export async function findMatchingTestimonial(
  supabase: SupabaseClient,
  criteria: {
    city?: string
    industry?: string
    serviceType?: string
    idealMatch?: string  // From LLM generation
  }
): Promise<Testimonial | null> {
  // Try exact match first
  let query = supabase.from('testimonials').select('*')
  
  if (criteria.city) {
    query = query.eq('city', criteria.city)
  }
  if (criteria.serviceType) {
    query = query.eq('service_type', criteria.serviceType)
  }
  
  const { data: exactMatch } = await query.limit(1).single()
  if (exactMatch) return exactMatch
  
  // Fallback: service type match only
  if (criteria.serviceType) {
    const { data: serviceMatch } = await supabase
      .from('testimonials')
      .select('*')
      .eq('service_type', criteria.serviceType)
      .limit(1)
      .single()
    if (serviceMatch) return serviceMatch
  }
  
  // Final fallback: featured testimonial
  const { data: featured } = await supabase
    .from('testimonials')
    .select('*')
    .eq('featured', true)
    .limit(1)
    .single()
  
  return featured
}
```

### Testimonial Component

```tsx
// components/testimonial-card.tsx

interface TestimonialCardProps {
  testimonial: Testimonial | null
  fallbackQuote?: string
}

export function TestimonialCard({ testimonial, fallbackQuote }: TestimonialCardProps) {
  if (!testimonial && !fallbackQuote) return null
  
  const quote = testimonial?.quote || fallbackQuote
  
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-3xl text-center">
        <blockquote className="text-xl md:text-2xl italic text-foreground mb-6">
          "{quote}"
        </blockquote>
        {testimonial && (
          <div className="flex items-center justify-center gap-4">
            {testimonial.author_image_url && (
              <Image
                src={testimonial.author_image_url}
                alt={testimonial.author_name}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div className="text-left">
              <div className="font-semibold">{testimonial.author_name}</div>
              {testimonial.author_title && testimonial.company_name && (
                <div className="text-sm text-muted-foreground">
                  {testimonial.author_title}, {testimonial.company_name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
```

---

## Internal Linking Strategy

### Link Types

1. **Sibling City Links** - Same service, different cities
2. **Sibling Service Links** - Same city, different services  
3. **Parent Links** - Back to main service page
4. **Cross-category Links** - Related industries or solutions

### Implementation

```typescript
// lib/seo/internal-links.ts

import { cities, services } from './data'

export function getSiblingCityLinks(currentCity: string, currentService: string, limit = 5) {
  const currentCityData = cities.find(c => c.slug === currentCity)
  if (!currentCityData) return []
  
  // Get cities in same state first, then nearby states
  const samseState = cities.filter(c => 
    c.slug !== currentCity && c.state === currentCityData.state
  )
  const otherCities = cities.filter(c => 
    c.slug !== currentCity && c.state !== currentCityData.state
  )
  
  return [...samseState, ...otherCities]
    .slice(0, limit)
    .map(city => ({
      href: `/services/${currentService}/${city.slug}`,
      label: city.name,
    }))
}

export function getSiblingServiceLinks(currentCity: string, currentService: string) {
  return services
    .filter(s => s.slug !== currentService)
    .map(service => ({
      href: `/services/${service.slug}/${currentCity}`,
      label: service.name,
    }))
}
```

### Internal Links Component

```tsx
// components/internal-links-section.tsx

interface InternalLinksSectionProps {
  currentCity: string
  currentService: string
  serviceName: string
  cityName: string
}

export function InternalLinksSection({ 
  currentCity, 
  currentService,
  serviceName,
  cityName 
}: InternalLinksSectionProps) {
  const cityLinks = getSiblingCityLinks(currentCity, currentService)
  const serviceLinks = getSiblingServiceLinks(currentCity, currentService)
  
  return (
    <section className="py-12 px-4 border-t bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-4">
              {serviceName} in Other Cities
            </h3>
            <ul className="space-y-2">
              {cityLinks.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {serviceName} {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">
              Other Services in {cityName}
            </h3>
            <ul className="space-y-2">
              {serviceLinks.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
```

---

## Technical SEO Requirements

### 1. Dynamic Sitemap

```typescript
// app/sitemap.ts
import { cities } from '@/lib/seo/cities'
import { services } from '@/lib/seo/services'
import { industries } from '@/lib/seo/industries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jarve.com.au'
  
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/work/blurbbuddy`, lastModified: new Date(), priority: 0.8 },
    // ...
  ]
  
  // Service + City pages
  const servicePages = services.flatMap(service =>
    cities.map(city => ({
      url: `${baseUrl}/services/${service.slug}/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  )
  
  // Industry pages
  const industryPages = industries.map(industry => ({
    url: `${baseUrl}/industries/${industry.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))
  
  return [...staticPages, ...servicePages, ...industryPages]
}
```

### 2. Structured Data (JSON-LD)

Add to each pSEO page:

```typescript
// For service+city pages
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'JARVE',
  description: 'Custom web app development',
  url: 'https://jarve.com.au',
  areaServed: {
    '@type': 'City',
    name: 'Sydney',
    containedInPlace: {
      '@type': 'State',
      name: 'New South Wales'
    }
  },
  serviceType: 'MVP Development',
  priceRange: '$5,000-$25,000'
}
```

### 3. Internal Linking Strategy

Each pSEO page should link to:
- Main homepage
- Related service pages
- Nearby city pages (e.g., Sydney links to Newcastle, Wollongong)
- Related industry pages
- Contact/CTA page

### 4. Canonical URLs

Set proper canonical URLs to avoid duplicate content:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://jarve.com.au/services/${params.service}/${params.city}`,
    },
  }
}
```

### 5. Complete Schema Markup

Add comprehensive JSON-LD to each page:

```typescript
// components/seo/service-city-schema.tsx

interface ServiceCitySchemaProps {
  service: ServiceData
  city: CityData
  content: GeneratedContent
}

export function ServiceCitySchema({ service, city, content }: ServiceCitySchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      // Organization
      {
        "@type": "Organization",
        "@id": "https://jarve.com.au/#organization",
        "name": "JARVE",
        "url": "https://jarve.com.au",
        "email": "hello@jarve.com.au",
        "logo": {
          "@type": "ImageObject",
          "url": "https://jarve.com.au/logo.png"
        },
        "sameAs": [
          // Add social profiles if any
        ]
      },
      // WebPage
      {
        "@type": "WebPage",
        "@id": `https://jarve.com.au/services/${service.slug}/${city.slug}/#webpage`,
        "url": `https://jarve.com.au/services/${service.slug}/${city.slug}`,
        "name": `${service.name} ${city.name} | JARVE`,
        "description": content.metaDescription,
        "isPartOf": {
          "@id": "https://jarve.com.au/#website"
        },
        "breadcrumb": {
          "@id": `https://jarve.com.au/services/${service.slug}/${city.slug}/#breadcrumb`
        }
      },
      // BreadcrumbList
      {
        "@type": "BreadcrumbList",
        "@id": `https://jarve.com.au/services/${service.slug}/${city.slug}/#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@id": "https://jarve.com.au/",
              "name": "Home"
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@id": "https://jarve.com.au/services/",
              "name": "Services"
            }
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@id": `https://jarve.com.au/services/${service.slug}/`,
              "name": service.name
            }
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@id": `https://jarve.com.au/services/${service.slug}/${city.slug}/`,
              "name": city.name
            }
          }
        ]
      },
      // Service
      {
        "@type": "Service",
        "@id": `https://jarve.com.au/services/${service.slug}/${city.slug}/#service`,
        "name": `${service.name} in ${city.name}`,
        "description": content.solutionOverview,
        "provider": {
          "@id": "https://jarve.com.au/#organization"
        },
        "areaServed": {
          "@type": "City",
          "name": city.name,
          "containedInPlace": {
            "@type": "State",
            "name": city.state,
            "containedInPlace": {
              "@type": "Country",
              "name": "Australia"
            }
          }
        },
        "serviceType": service.name,
        "offers": {
          "@type": "Offer",
          "priceRange": service.priceRange,
          "priceCurrency": "AUD"
        }
      },
      // FAQPage (if FAQs present)
      {
        "@type": "FAQPage",
        "@id": `https://jarve.com.au/services/${service.slug}/${city.slug}/#faq`,
        "mainEntity": content.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### 6. Open Graph & Twitter Cards

```typescript
// In generateMetadata function

export async function generateMetadata({ params }): Promise<Metadata> {
  const service = getService(params.service)
  const city = getCity(params.city)
  const content = await getPageContent(params.service, params.city)
  
  const title = `${content.heroHeadline} | JARVE`
  const description = content.metaDescription
  const url = `https://jarve.com.au/services/${params.service}/${params.city}`
  
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'JARVE',
      type: 'website',
      locale: 'en_AU',
      images: [
        {
          url: `https://jarve.com.au/og/services/${params.service}.png`,
          width: 1200,
          height: 630,
          alt: `${service.name} - JARVE`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://jarve.com.au/og/services/${params.service}.png`],
    },
  }
}
```

---

## Performance Considerations

### Static Generation (Recommended)

Generate all pages at build time for best performance:

```typescript
// app/services/[service]/[city]/page.tsx

// This generates all pages at build time
export async function generateStaticParams() {
  return services.flatMap(s => 
    cities.map(c => ({ 
      service: s.slug, 
      city: c.slug 
    }))
  )
}

// Optional: Revalidate every 24 hours for content updates
export const revalidate = 86400
```

### Database Content Caching

If fetching generated content from database:

```typescript
import { unstable_cache } from 'next/cache'

const getCachedContent = unstable_cache(
  async (serviceSlug: string, citySlug: string) => {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('pseo_content')
      .select('content')
      .eq('service_slug', serviceSlug)
      .eq('city_slug', citySlug)
      .single()
    return data?.content
  },
  ['pseo-content'],
  { revalidate: 3600 } // Cache for 1 hour
)
```

### Image Loading Strategy

```tsx
// Hero image: priority load
<Image src={heroImage} priority />

// Below fold images: lazy load with blur placeholder
<Image 
  src={otherImage} 
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

---

## Complete Component Checklist

### Shared Components (Build Once)

- [ ] `Header` - Already exists
- [ ] `Footer` - Already exists
- [ ] `Breadcrumbs` - New component
- [ ] `TrustBar` - New component (simple stats bar)
- [ ] `ProcessSection` - New component (how it works)
- [ ] `TestimonialCard` - New component
- [ ] `InternalLinksSection` - New component
- [ ] `FAQAccordion` - Adapt from existing FAQ section
- [ ] `ServiceCitySchema` - JSON-LD component
- [ ] `CTASection` - Reusable CTA block

### Page-Specific Template

- [ ] `ServiceCityTemplate` - Main template composing all sections

### Data Files

- [ ] `lib/seo/cities.ts` - City data with business context
- [ ] `lib/seo/services.ts` - Service data with features, pricing
- [ ] `lib/seo/industries.ts` - Industry data (for phase 2)
- [ ] `lib/seo/internal-links.ts` - Link generation utilities
- [ ] `lib/seo/testimonials.ts` - Testimonial matching logic

### Database Tables

- [ ] `pseo_content` - Generated page content
- [ ] `testimonials` - Client testimonials (may already exist)
- [ ] `seo_rankings` - Performance tracking (optional)
- [ ] `seo_page_stats` - Aggregated stats (optional)

### API Routes

- [ ] `POST /api/admin/seo/generate` - Generate content for a page
- [ ] `POST /api/admin/seo/generate-batch` - Generate multiple pages
- [ ] `GET /api/cron/seo-rankings` - Fetch GSC data (optional)

### Admin Pages

- [ ] `/admin/seo` - Overview dashboard
- [ ] `/admin/seo/generate` - Content generation interface
- [ ] `/admin/seo/review` - Review/approve generated content
- [ ] `/admin/seo/performance` - Rankings dashboard (optional)

---

## Content Strategy for pSEO Pages

### The Golden Rule

**If you can swap the city name and the content still works identically, it's too generic.**

Google's helpful content system specifically targets this pattern. Every page must have genuine local specificity that couldn't apply to another city.

### Content Quality Criteria

**Genuine Local Signals (Required):**
- Reference real local details: ecosystem size, specific industries, hubs, accelerators
- Mention practical Australian business context: ABN, AUD, timezone alignment
- Include challenges specific to that market (e.g., Perth's mining tech needs, Canberra's government compliance)

**Voice (Required):**
- Sound like James (practical tradie who builds software), not a marketing agency
- First person singular ("I build..." not "We build...")
- Direct and matter-of-fact, not polished corporate copy
- No filler phrases: "moves fast", "competitive landscape", "cutting-edge"

**Brevity (Required):**
- City context: max 50 words
- Problem statement: max 60 words
- Solution: max 60 words
- Benefits: max 25 words each
- These are pSEO pages, not blog posts. Scannable beats comprehensive.

### What Makes Content Feel Local

**Good (Specific):**
- "Sydney's 2,500+ startups compete for the same developer talent"
- "Perth's mining sector runs on legacy systems built 15 years ago"
- "Brisbane's construction boom means everyone needs job management software yesterday"

**Bad (Generic):**
- "Sydney is a fast-moving business environment"
- "Perth businesses need modern software solutions"
- "Brisbane companies are looking to grow"

### Local Signals Section

Every page includes 2-3 practical signals that matter to local business owners:
- Timezone alignment (especially for Perth)
- Australian business setup (ABN, AUD, local invoicing)
- Communication style (direct, same working hours)
- In-person availability if relevant

These aren't fluff — they're genuine differentiators vs. offshore developers.

---

## LLM Content Generation Pipeline

### Generation Flow

```
┌─────────────────┐
│ Admin triggers  │
│ generation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build prompt    │  ← Combine template + service + city data
│ from template   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Call LLM API    │  ← Claude Sonnet recommended
│ (Anthropic)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse JSON      │
│ response        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store in        │  ← pseo_content table
│ database        │    status = 'draft'
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin reviews   │  ← Preview, edit if needed
│ and approves    │    status = 'published'
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Page renders    │  ← Pulls from DB
│ live content    │
└─────────────────┘
```

### Prompt Template Location

See `PROMPT-pseo-content.md` for the complete prompt template.

### Content Generation API

```typescript
// app/api/admin/seo/generate/route.ts

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/admin'
import { buildPrompt } from '@/lib/seo/content-generator'
import { getService, getCity } from '@/lib/seo/data'

const anthropic = new Anthropic()

export async function POST(request: Request) {
  const { serviceSlug, citySlug } = await request.json()
  
  const service = getService(serviceSlug)
  const city = getCity(citySlug)
  
  if (!service || !city) {
    return Response.json({ error: 'Invalid service or city' }, { status: 400 })
  }

  // Build the prompt from template
  const prompt = buildPrompt({ service, city })

  // Call Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  // Parse JSON from response
  const contentText = message.content[0].type === 'text' 
    ? message.content[0].text 
    : ''
  
  const jsonMatch = contentText.match(/```json\n?([\s\S]*?)\n?```/) || 
                    contentText.match(/\{[\s\S]*\}/)
  
  if (!jsonMatch) {
    return Response.json({ error: 'Failed to parse LLM response' }, { status: 500 })
  }
  
  const jsonStr = jsonMatch[1] || jsonMatch[0]
  const content = JSON.parse(jsonStr)

  // Validate required fields
  const requiredFields = [
    'heroHeadline', 'heroSubheadline', 'cityContext', 
    'problemStatement', 'solutionOverview', 'benefits', 
    'ctaText', 'metaDescription', 'faqs'
  ]
  
  for (const field of requiredFields) {
    if (!content[field]) {
      return Response.json({ error: `Missing field: ${field}` }, { status: 500 })
    }
  }

  // Store in database
  const supabase = createAdminClient()
  const { error } = await supabase.from('pseo_content').upsert({
    page_type: 'service-city',
    service_slug: serviceSlug,
    city_slug: citySlug,
    content,
    model_used: 'claude-sonnet-4-20250514',
    prompt_version: 1,
    status: 'draft',
    generated_at: new Date().toISOString(),
  }, {
    onConflict: 'page_type,service_slug,city_slug'
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ 
    success: true, 
    service: serviceSlug, 
    city: citySlug,
    content 
  })
}
```

### Cost Estimate

Using Claude 3.5 Sonnet:
- Input: ~800 tokens (prompt)
- Output: ~1,200 tokens (response)
- Cost per page: ~$0.006
- 90 pages: ~$0.54 total
- Full 187 pages: ~$1.12 total

**Regenerating monthly: ~$15/year**

---

## Complete Database Schema

```sql
-- =============================================
-- pSEO Content Storage
-- =============================================

create table pseo_content (
  id uuid primary key default gen_random_uuid(),
  
  -- Page identification
  page_type text not null,                    -- 'service-city', 'industry', 'solution'
  service_slug text,
  city_slug text,
  industry_slug text,
  solution_slug text,
  
  -- Generated content (the JSON from LLM)
  content jsonb not null,
  /*
    Expected structure:
    {
      "heroHeadline": "...",
      "heroSubheadline": "...",
      "cityContext": "...",           -- max 50 words, genuinely local
      "problemStatement": "...",       -- max 60 words
      "solution": "...",               -- max 60 words
      "benefits": [
        { "title": "...", "description": "..." }  -- max 25 words each
      ],
      "localSignals": ["...", "...", "..."],  -- timezone, ABN, Australian context
      "ctaText": "...",
      "metaDescription": "...",
      "faq": { "question": "...", "answer": "..." },  -- one specific FAQ
      "testimonialMatch": "..."
    }
  */
  
  -- Generation metadata
  prompt_version int default 1,
  model_used text,
  generated_at timestamptz default now(),
  
  -- Editorial workflow
  status text default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  reviewed_by uuid references employees(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  
  -- Manual overrides (sparse - only edited fields)
  manual_edits jsonb default '{}',
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Unique constraint for page identification
  unique(page_type, service_slug, city_slug, industry_slug, solution_slug)
);

-- Indexes
create index idx_pseo_content_lookup 
  on pseo_content(page_type, service_slug, city_slug);
create index idx_pseo_content_status 
  on pseo_content(status);

-- Updated at trigger
create trigger pseo_content_updated_at
  before update on pseo_content
  for each row execute function update_updated_at_column();


-- =============================================
-- Testimonials (if not already exists)
-- =============================================

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  
  -- Content
  quote text not null,
  author_name text not null,
  author_title text,
  company_name text,
  author_image_url text,
  
  -- Matching criteria for pSEO pages
  city text,
  industry text,
  service_type text,
  tags text[] default '{}',
  
  -- Display settings
  featured boolean default false,
  rating int check (rating between 1 and 5),
  display_order int default 0,
  
  -- Relations
  project_id uuid references projects(id),
  client_id uuid references clients(id),
  
  -- Timestamps
  created_at timestamptz default now()
);

create index idx_testimonials_matching 
  on testimonials(city, industry, service_type);
create index idx_testimonials_featured 
  on testimonials(featured) where featured = true;


-- =============================================
-- SEO Performance Tracking (Optional)
-- =============================================

create table seo_page_stats (
  id uuid primary key default gen_random_uuid(),
  
  -- Identification
  date date not null,
  page_path text not null,
  
  -- Metrics from Google Search Console
  clicks int default 0,
  impressions int default 0,
  ctr numeric(6,4),           -- e.g., 0.0350 = 3.5%
  avg_position numeric(5,2),  -- e.g., 8.50
  
  -- Top queries for this page (denormalized for easy access)
  top_queries jsonb default '[]',
  /*
    [
      { "query": "mvp developer sydney", "clicks": 12, "position": 4.2 },
      { "query": "sydney startup developer", "clicks": 8, "position": 6.1 }
    ]
  */
  
  -- Timestamps
  created_at timestamptz default now(),
  
  unique(date, page_path)
);

create index idx_seo_page_stats_date on seo_page_stats(date);
create index idx_seo_page_stats_path on seo_page_stats(page_path);


-- =============================================
-- Row Level Security
-- =============================================

alter table pseo_content enable row level security;
alter table testimonials enable row level security;
alter table seo_page_stats enable row level security;

-- Admin-only access for pseo_content
create policy "Admin full access to pseo_content"
  on pseo_content for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Public read for published content
create policy "Public read published pseo_content"
  on pseo_content for select
  using (status = 'published');

-- Testimonials readable by all authenticated
create policy "Authenticated read testimonials"
  on testimonials for select
  using (auth.role() = 'authenticated');

-- Admin manage testimonials
create policy "Admin manage testimonials"
  on testimonials for all
  using (auth.jwt() ->> 'role' = 'admin');
```

---

## Implementation Roadmap

### Phase 1: Foundation (Days 1-2)
- [ ] Create `lib/seo/cities.ts` with all city data
- [ ] Create `lib/seo/services.ts` with all service data
- [ ] Create `lib/seo/data.ts` exports and utilities
- [ ] Run database migrations (pseo_content, testimonials)
- [ ] Build `app/sitemap.ts`

### Phase 2: Content Generation (Days 2-3)
- [ ] Create `lib/seo/content-generator.ts` (prompt builder)
- [ ] Build `POST /api/admin/seo/generate` route
- [ ] Build `/admin/seo/generate` UI
- [ ] Generate content for 5 Tier 1 cities × 1 service (test batch)
- [ ] Review and iterate on prompt if needed

### Phase 3: Page Template (Days 3-4)
- [ ] Build shared components (Breadcrumbs, TrustBar, etc.)
- [ ] Build `ServiceCityTemplate` component
- [ ] Build `ServiceCitySchema` JSON-LD component
- [ ] Create `/services/[service]/[city]/page.tsx`
- [ ] Test with generated content

### Phase 4: Full Generation (Day 5)
- [ ] Generate content for all Tier 1 cities (5 × 6 = 30 pages)
- [ ] Build `/admin/seo/review` for approval workflow
- [ ] Review and approve all content
- [ ] Deploy and submit sitemap to GSC

### Phase 5: Expansion (Week 2+)
- [ ] Add Tier 2 cities (10 more cities)
- [ ] Create industry page template and content
- [ ] Build SEO performance dashboard
- [ ] Monitor and iterate

---

## Implementation Checklist (Copy This)

```markdown
## pSEO Implementation Checklist

### Setup
- [ ] Add Anthropic API key to environment
- [ ] Run database migrations
- [ ] Verify Google Search Console access

### Data Layer
- [ ] lib/seo/cities.ts
- [ ] lib/seo/services.ts
- [ ] lib/seo/industries.ts (Phase 2)
- [ ] lib/seo/data.ts (exports)
- [ ] lib/seo/content-generator.ts
- [ ] lib/seo/internal-links.ts
- [ ] lib/seo/testimonials.ts

### Components
- [ ] components/breadcrumbs.tsx
- [ ] components/trust-bar.tsx
- [ ] components/process-section.tsx
- [ ] components/testimonial-card.tsx
- [ ] components/internal-links-section.tsx
- [ ] components/seo/service-city-schema.tsx
- [ ] components/cta-section.tsx

### Templates
- [ ] app/services/[service]/[city]/page.tsx
- [ ] app/services/[service]/[city]/template.tsx

### API Routes
- [ ] app/api/admin/seo/generate/route.ts
- [ ] app/api/admin/seo/generate-batch/route.ts

### Admin Pages
- [ ] app/admin/seo/page.tsx (dashboard)
- [ ] app/admin/seo/generate/page.tsx
- [ ] app/admin/seo/review/page.tsx

### SEO Files
- [ ] app/sitemap.ts (update with pSEO pages)
- [ ] app/robots.ts (verify /services/ is allowed)

### Content Generation
- [ ] Generate Tier 1 content (30 pages)
- [ ] Review all generated content
- [ ] Publish approved content

### Launch
- [ ] Deploy to production
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify pages are indexing (after 1 week)

### Monitoring (Ongoing)
- [ ] Weekly: Check GSC for indexing issues
- [ ] Monthly: Review performance data
- [ ] Quarterly: Refresh/regenerate underperforming content
```

---

## Keyword Targeting Examples

### High Intent (Bottom of Funnel)
- "mvp developer sydney"
- "custom software development melbourne"
- "web app developer brisbane"
- "hire app developer perth"

### Problem-Aware (Middle of Funnel)
- "replace spreadsheets with software"
- "custom crm development australia"
- "construction job management software"
- "tradify alternative custom"

### Industry-Specific
- "construction software developer"
- "real estate app development"
- "legal tech development"
- "healthcare app developer australia"

---

## Measurement & KPIs

### Track:
1. **Organic impressions** per page category
2. **Click-through rate** from search
3. **Rankings** for target keywords
4. **Leads generated** per page
5. **Time on page** / engagement

### Tools:
- Google Search Console (rankings, impressions)
- Google Analytics (traffic, conversions)
- Ahrefs/SEMrush (keyword tracking)

---

## Risk Mitigation

### Google Quality Guidelines

**Risks of pSEO:**
- Thin content penalty
- Duplicate content issues
- Doorway page classification

**Mitigation:**
1. Ensure each page provides genuine value
2. Include substantial unique content per page
3. Make pages useful to users, not just for SEO
4. Don't create pages that all funnel to one conversion page without value
5. Monitor Search Console for manual actions

### Content Quality Checklist

Before publishing any pSEO page:
- [ ] Does this page help the user?
- [ ] Is there at least 300 words of unique content?
- [ ] Are the local details accurate and genuine?
- [ ] Would this page exist if SEO didn't exist?
- [ ] Does the page have real value beyond SEO?

---

## Quick Wins (Start Here)

If implementing the full strategy seems overwhelming, start with these high-impact pages:

1. **5 Service + Tier-1 City pages** (Sydney, Melbourne, Brisbane, Perth, Adelaide)
   - `/services/mvp-development/sydney`
   - `/services/web-app-development/melbourne`
   - `/services/custom-software/brisbane`
   - `/services/internal-tools/perth`
   - `/services/business-automation/adelaide`

2. **3 Industry pages** (highest demand)
   - `/industries/construction`
   - `/industries/real-estate`
   - `/industries/professional-services`

3. **2 Solution pages** (most searched problems)
   - `/solutions/replace-spreadsheets`
   - `/solutions/job-management-software`

**Total Quick Win Pages: 10**

This gives you a solid pSEO foundation to test and iterate from.

---

## Next Steps

1. **Approve this strategy** and prioritize phases
2. **Set up tracking** (Google Search Console, Analytics)
3. **Create data files** with cities, services, industries
4. **Build page templates** with proper SEO components
5. **Generate initial content** for Phase 1 pages
6. **Launch and monitor** for 4-6 weeks
7. **Iterate** based on performance data

---

*Last updated: January 2026*
