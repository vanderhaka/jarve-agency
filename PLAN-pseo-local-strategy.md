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

### Service + City Page Template

**URL:** `/services/mvp-development/sydney`
**Title:** `MVP Development Sydney | Launch Your Startup Fast | JARVE`
**H1:** `MVP Development in Sydney`

**Content Sections:**
1. Hero with city-specific headline
2. "Why Sydney businesses choose us" (local proof)
3. Services overview (same as main service)
4. Local case studies or testimonials (if available)
5. Pricing section
6. FAQ (with local variations)
7. Contact CTA

**Key Elements:**
- City name in title, H1, and naturally throughout copy
- Schema.org LocalBusiness markup
- Link to main service page
- Internal links to related city pages

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

---

## Content Strategy for pSEO Pages

### Avoid Thin/Duplicate Content

**DO:**
- Include city-specific details (business landscape, local industries)
- Mention state regulations if relevant
- Reference local success stories
- Include genuine regional variations

**DON'T:**
- Just swap city name in identical content
- Create pages with only a few sentences
- Have near-duplicate meta descriptions

### Content Uniqueness Framework

For each service+city page, include:

1. **City Context (50-100 words)**
   - "[City] is home to [X businesses/startups]..."
   - "As [City's] tech scene grows..."

2. **Local Problem Statement (100-150 words)**
   - Specific challenges in that market
   - Industry mix of that region

3. **Service Details (shared/modular)**
   - Can be similar across cities

4. **Local Proof (if available)**
   - Testimonials from that region
   - Case studies from local businesses

5. **Local CTA**
   - "Book a call with a [City]-based developer"

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `lib/seo/` data files
- [ ] Build `app/sitemap.ts`
- [ ] Add JSON-LD schema components
- [ ] Create base page templates

### Phase 2: Service + City Pages (Week 2)
- [ ] Implement `/services/[service]/[city]/page.tsx`
- [ ] Generate content for Tier 1 cities (5 cities × 6 services = 30 pages)
- [ ] Add internal linking

### Phase 3: Industry Pages (Week 3)
- [ ] Implement `/industries/[industry]/page.tsx`
- [ ] Create content for 12 industry pages
- [ ] Link from main services section

### Phase 4: Expansion (Week 4+)
- [ ] Add Tier 2 cities
- [ ] Create industry+city combination pages
- [ ] Add solution/problem pages
- [ ] Add comparison pages

### Phase 5: Measurement & Iteration
- [ ] Set up Google Search Console tracking
- [ ] Monitor rankings for target keywords
- [ ] A/B test page templates
- [ ] Expand to performing categories

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
