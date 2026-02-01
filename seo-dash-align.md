# Unified pSEO System Specification v1.0

> The definitive feature set for programmatic SEO projects. Apply to any business vertical.

---

## Table of Contents

1. [Content Generation Pipeline](#1-content-generation-pipeline)
2. [Content Structure & Types](#2-content-structure--types)
3. [Quality Gate System](#3-quality-gate-system)
4. [Location & Entity Data](#4-location--entity-data)
5. [Publishing Pipeline](#5-publishing-pipeline)
6. [Page Rendering](#6-page-rendering)
7. [Technical SEO](#7-technical-seo)
8. [SERP Tracking](#8-serp-tracking)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Keyword Management](#10-keyword-management)
11. [Internal Linking](#11-internal-linking)
12. [Alert System](#12-alert-system)
13. [Google Search Console Integration](#13-google-search-console-integration)
14. [Content Lifecycle Management](#14-content-lifecycle-management)
15. [Database Schema](#15-database-schema)
16. [API Endpoints](#16-api-endpoints)
17. [Cron Jobs](#17-cron-jobs)
18. [Environment & Config](#18-environment--config)
19. [Security](#19-security)
20. [Export & Reporting](#20-export--reporting)

---

## 1. Content Generation Pipeline

### 1.1 Generation Engine

| Attribute | Specification |
|-----------|---------------|
| **Model** | `claude-sonnet-4-20250514` (cost-effective for bulk) |
| **Fallback** | `claude-sonnet-4-20250514` if rate limited |
| **Output Format** | Structured JSON (not markdown) |
| **Voice Post-Processing** | Configurable pronoun replacement (we→I or I→we) |
| **Retry Logic** | 3 attempts with exponential backoff |
| **Rate Limiting** | Max 10 concurrent requests, 60/min |

### 1.2 Generation Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `bulk` | Generate all missing pages | Initial population |
| `single` | Generate one specific page | Testing/debugging |
| `regenerate` | Overwrite existing draft | Content refresh |
| `fill-gaps` | Only generate where content is NULL | Resume interrupted runs |

### 1.3 CLI Interface

```bash
# Count what would be generated
pnpm seo generate --count

# Dry run (show prompts, no API calls)
pnpm seo generate --dry-run --limit 5

# Generate specific route pattern
pnpm seo generate --pattern services-city --limit 10

# Generate specific location
pnpm seo generate --location "henley-beach"

# Generate specific page type
pnpm seo generate --type service_suburb

# Regenerate existing drafts
pnpm seo generate --regenerate --pattern comparisons

# Resume from specific slug
pnpm seo generate --after "interior-painting-glenelg"
```

### 1.4 Generation Prompt Template

```typescript
interface GenerationContext {
  // Required
  pageType: RoutePattern;
  primaryEntity: string;        // Service, industry, solution, etc.
  
  // Location (optional)
  location?: {
    name: string;
    tier: number;
    medianPrice?: number;
    demographicNotes?: string;
    architecturalStyle?: string;
    isCoastal?: boolean;
    nearbyLandmarks?: string[];
  };
  
  // Business context
  business: {
    name: string;
    ownerName: string;
    pronounStyle: 'first-person-singular' | 'first-person-plural';
    yearsExperience?: number;
    googleRating?: number;
    reviewCount?: number;
    uniqueSellingPoints: string[];
  };
  
  // Comparison context (for comparison pages)
  comparison?: {
    competitorName: string;
    competitorWeaknesses: string[];
    ourAdvantages: string[];
  };
}
```

### 1.5 Key Files

```
/scripts/
  └── generate-seo-content.ts    # CLI entry point

/lib/seo/generation/
  ├── index.ts                   # Main orchestrator
  ├── prompt-builder.ts          # Constructs prompts from context
  ├── claude-client.ts           # Anthropic API wrapper
  ├── response-parser.ts         # JSON extraction & validation
  ├── post-processor.ts          # Voice, formatting cleanup
  └── batch-processor.ts         # Concurrency & rate limiting
```

---

## 2. Content Structure & Types

### 2.1 Universal Content Schema

```typescript
interface SeoContent {
  // Hero Section
  heroHeadline: string;          // Max 8 words, no location stuffing
  heroSubheadline: string;       // Max 20 words
  
  // Context Section
  localContext?: string;         // Max 50 words, location-specific relevance
  
  // Problem/Solution Section
  problemStatement: string;      // Max 60 words, customer pain points
  solution: string;              // Max 60 words, how we solve it
  
  // Benefits Section
  benefits: {
    title: string;               // Max 5 words
    description: string;         // Max 30 words
    icon?: string;               // Lucide icon name
  }[];                           // Exactly 3 items
  
  // Trust Signals
  localSignals: string[];        // 3 trust/credibility statements
  
  // Social Proof
  testimonialMatch?: string;     // Description of ideal testimonial to display
  
  // Call to Action
  ctaHeadline: string;           // Max 8 words
  ctaText: string;               // Button text, max 4 words
  ctaSubtext?: string;           // Below button, max 10 words
  
  // FAQ Section
  faq: {
    question: string;
    answer: string;              // Max 100 words per answer
  }[];                           // 3-5 items
  
  // SEO Meta
  metaTitle?: string;            // Max 60 chars (auto-generated if null)
  metaDescription: string;       // Max 155 chars
  
  // Layout & Display
  layout: LayoutVariant;
  
  // Internal Linking Hints
  relatedServices?: string[];    // Slugs to prioritize in cross-links
  relatedLocations?: string[];   // Slugs to prioritize in cross-links
}

type LayoutVariant = 
  | 'standard'           // Default balanced layout
  | 'problem-first'      // Lead with pain points
  | 'benefits-grid'      // Visual benefits emphasis
  | 'testimonial-heavy'  // Social proof focused
  | 'faq-heavy'          // Educational/informational
  | 'story-flow';        // Narrative structure
```

### 2.2 Route Patterns

| Pattern | URL Structure | Example | Use Case |
|---------|---------------|---------|----------|
| `service-location` | `/{service}/{location}` | `/interior-painting/henley-beach` | Core service pages |
| `industry` | `/industries/{industry}` | `/industries/healthcare` | B2B verticals |
| `industry-location` | `/industries/{industry}/{location}` | `/industries/retail/sydney` | B2B + geo |
| `solution` | `/solutions/{problem}` | `/solutions/legacy-system-replacement` | Problem-focused |
| `comparison` | `/compare/{competitor}` | `/compare/spreadsheets` | Competitor alternatives |
| `location-hub` | `/locations/{location}` | `/locations/henley-beach` | Location landing pages |
| `service-hub` | `/services/{service}` | `/services/interior-painting` | Service landing pages |

### 2.3 Page Status Lifecycle

```
draft → pending_review → approved → scheduled → published → archived
                ↓
            rejected (with rejection_reason)
```

| Status | Description |
|--------|-------------|
| `draft` | AI-generated, not validated |
| `pending_review` | Passed quality gate, awaiting approval |
| `approved` | Human-approved, ready for scheduling |
| `scheduled` | Has future `publish_at` date |
| `published` | Live on site |
| `archived` | Removed from site, kept for reference |
| `rejected` | Failed review, needs regeneration |

---

## 3. Quality Gate System

### 3.1 Validation Levels

| Level | Behavior | Use Case |
|-------|----------|----------|
| `blocking` | Fails validation, cannot publish | Critical issues |
| `warning` | Logged, allows publish | Minor issues |
| `info` | Logged only | Tracking/metrics |

### 3.2 Blocking Rules

```typescript
const blockingRules: ValidationRule[] = [
  {
    id: 'false-claims',
    name: 'False Experience Claims',
    description: 'Detects fabricated statistics or experience claims',
    patterns: [
      /I've (built|completed|delivered|painted) \d+/i,
      /over \d+ years serving/i,
      /\d+ satisfied (customers|clients)/i,
      /(built|painted|served) .* in \[location\]/i,
    ],
    excludeFields: ['faq.question'], // Customer voice allowed in FAQ questions
  },
  {
    id: 'wrong-pronoun',
    name: 'Pronoun Consistency',
    description: 'Ensures consistent voice (I vs we)',
    check: (content, config) => {
      const forbidden = config.pronounStyle === 'first-person-singular' 
        ? /\b(we|our|us)\b/gi 
        : /\b(I|my|me)\b/gi;
      // Implementation
    },
    excludeFields: ['faq.question'],
  },
  {
    id: 'buzzwords',
    name: 'Corporate Buzzword Detection',
    patterns: [
      /\b(synergy|synergies|synergistic)\b/i,
      /\b(leverage|leveraging|leveraged)\b/i,
      /\b(cutting-edge|bleeding-edge)\b/i,
      /\b(innovative|innovation)\b/i,
      /\b(disrupt|disruptive|disruption)\b/i,
      /\b(holistic|holistically)\b/i,
      /\b(paradigm|paradigm-shift)\b/i,
      /\b(robust|scalable)\b/i,
      /\b(best-in-class|world-class)\b/i,
      /\b(turnkey|end-to-end)\b/i,
    ],
  },
  {
    id: 'required-fields',
    name: 'Required Fields Present',
    check: (content) => {
      const required = [
        'heroHeadline', 'heroSubheadline', 'problemStatement',
        'solution', 'benefits', 'ctaText', 'faq', 'metaDescription'
      ];
      // Implementation
    },
  },
  {
    id: 'word-limits',
    name: 'Word Count Limits',
    limits: {
      heroHeadline: 8,
      heroSubheadline: 20,
      localContext: 50,
      problemStatement: 60,
      solution: 60,
      'benefits.*.title': 5,
      'benefits.*.description': 30,
      ctaText: 4,
      'faq.*.answer': 100,
    },
  },
  {
    id: 'benefits-count',
    name: 'Benefits Array Length',
    check: (content) => content.benefits?.length === 3,
  },
  {
    id: 'location-accuracy',
    name: 'Location Name Accuracy',
    description: 'Ensures location names match database exactly',
    check: (content, context) => {
      if (!context.location) return true;
      const locationMentions = extractLocationMentions(content);
      return locationMentions.every(m => 
        m.toLowerCase() === context.location.name.toLowerCase()
      );
    },
  },
  {
    id: 'meta-length',
    name: 'Meta Description Length',
    check: (content) => {
      const len = content.metaDescription?.length || 0;
      return len >= 120 && len <= 155;
    },
  },
];
```

### 3.3 Warning Rules

```typescript
const warningRules: ValidationRule[] = [
  {
    id: 'generic-cta',
    name: 'Generic CTA Text',
    patterns: [
      /^(get started|contact us|learn more|click here|submit)$/i,
    ],
    field: 'ctaText',
  },
  {
    id: 'low-faq-count',
    name: 'Low FAQ Count',
    check: (content) => (content.faq?.length || 0) >= 3,
  },
  {
    id: 'missing-local-context',
    name: 'Missing Local Context',
    check: (content, context) => {
      if (!context.location) return true;
      return !!content.localContext;
    },
  },
  {
    id: 'duplicate-benefit-titles',
    name: 'Duplicate Benefit Titles',
    check: (content) => {
      const titles = content.benefits?.map(b => b.title.toLowerCase());
      return new Set(titles).size === titles?.length;
    },
  },
  {
    id: 'faq-question-format',
    name: 'FAQ Questions End With ?',
    check: (content) => {
      return content.faq?.every(f => f.question.trim().endsWith('?'));
    },
  },
];
```

### 3.4 Quality Gate Response

```typescript
interface QualityGateResult {
  passed: boolean;
  score: number;                 // 0-100
  errors: ValidationError[];     // Blocking issues
  warnings: ValidationWarning[]; // Non-blocking issues
  info: ValidationInfo[];        // Informational
  checkedAt: string;             // ISO timestamp
  contentHash: string;           // For change detection
}

interface ValidationError {
  ruleId: string;
  ruleName: string;
  field?: string;
  message: string;
  matchedText?: string;
  suggestion?: string;
}
```

### 3.5 Key Files

```
/lib/seo/quality-gate/
  ├── index.ts                   # Main validate() function
  ├── rules/
  │   ├── blocking.ts            # Blocking rules
  │   ├── warnings.ts            # Warning rules
  │   └── info.ts                # Info rules
  ├── checks/
  │   ├── word-count.ts
  │   ├── pattern-match.ts
  │   ├── field-presence.ts
  │   └── location-accuracy.ts
  └── types.ts
```

---

## 4. Location & Entity Data

### 4.1 Location Schema

```typescript
interface Location {
  id: string;                    // UUID
  slug: string;                  // URL-safe identifier
  name: string;                  // Display name
  type: 'city' | 'suburb' | 'region' | 'state';
  
  // Hierarchy
  parentId?: string;             // Parent location (suburb → city)
  
  // Tier System
  tier: 1 | 2 | 3;
  tierReason?: string;           // Why this tier
  
  // Geographic
  state?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  isCoastal?: boolean;
  
  // Demographics (for content context)
  medianPropertyPrice?: number;
  predominantHousingEra?: string;   // "1920s-1950s", "1960s-1980s", etc.
  architecturalStyle?: string;       // "Federation", "Art Deco", etc.
  demographicNotes?: string;         // Free text for AI context
  
  // Landmarks (for local relevance)
  nearbyLandmarks?: string[];
  
  // Meta
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Tier Definitions

| Tier | Criteria | Publishing Priority |
|------|----------|---------------------|
| **1** | Highest value (major metros, affluent suburbs, high search volume) | First |
| **2** | Medium value (secondary cities, established suburbs) | Second |
| **3** | Lower value (smaller areas, emerging suburbs) | Third |

### 4.3 Service/Entity Schema

```typescript
interface ServiceEntity {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;      // Max 20 words
  longDescription?: string;      // For hub pages
  
  // Categorization
  category?: string;
  tags?: string[];
  
  // Content hints for AI
  targetAudience?: string;
  painPoints?: string[];
  uniqueSellingPoints?: string[];
  
  // Display
  icon?: string;                 // Lucide icon name
  displayOrder: number;
  
  // Meta
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Key Files

```
/lib/seo/data/
  ├── locations.ts               # Location definitions
  ├── services.ts                # Service definitions
  ├── industries.ts              # Industry definitions
  ├── solutions.ts               # Solution definitions
  ├── comparisons.ts             # Comparison definitions
  └── seed.sql                   # Database seed script
```

---

## 5. Publishing Pipeline

### 5.1 Publishing Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Draft     │────▶│ Quality Gate │────▶│  Approved   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │   Rejected   │     │  Scheduled  │
                    └──────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Published  │
                                        └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────────────┐
                                        │ Post-Publish Tasks  │
                                        │ • Revalidate cache  │
                                        │ • Update sitemap    │
                                        │ • Request indexing  │
                                        │ • Update internal   │
                                        │   links             │
                                        └─────────────────────┘
```

### 5.2 Drip Publishing Configuration

```typescript
interface DripConfig {
  enabled: boolean;
  pagesPerRun: number;           // Default: 5
  schedule: string;              // Cron expression
  
  // Priority ordering
  priorityOrder: {
    routePattern: RoutePattern;
    tierOrder: 'asc' | 'desc';   // 1→3 or 3→1
  }[];
  
  // Constraints
  maxPagesPerDay?: number;
  blackoutDays?: number[];       // 0=Sunday, 6=Saturday
  
  // Quality requirements
  requireQualityGate: boolean;
  minQualityScore?: number;      // 0-100
}

// Default config
const defaultDripConfig: DripConfig = {
  enabled: true,
  pagesPerRun: 5,
  schedule: '0 2 * * *',         // 2 AM UTC daily
  priorityOrder: [
    { routePattern: 'service-location', tierOrder: 'asc' },
    { routePattern: 'service-hub', tierOrder: 'asc' },
    { routePattern: 'industry', tierOrder: 'asc' },
    { routePattern: 'comparison', tierOrder: 'asc' },
    { routePattern: 'solution', tierOrder: 'asc' },
    { routePattern: 'industry-location', tierOrder: 'asc' },
    { routePattern: 'location-hub', tierOrder: 'asc' },
  ],
  requireQualityGate: true,
  minQualityScore: 80,
};
```

### 5.3 Publishing Algorithm

```typescript
async function getNextPagesToPublish(limit: number): Promise<SeoPage[]> {
  const config = await getDripConfig();
  
  let pages: SeoPage[] = [];
  
  for (const priority of config.priorityOrder) {
    if (pages.length >= limit) break;
    
    const remaining = limit - pages.length;
    
    const batch = await db
      .from('seo_pages')
      .select('*')
      .eq('status', 'approved')
      .eq('route_pattern', priority.routePattern)
      .order('location_tier', { ascending: priority.tierOrder === 'asc' })
      .order('created_at', { ascending: true })
      .limit(remaining);
    
    pages = [...pages, ...batch];
  }
  
  return pages;
}
```

### 5.4 Post-Publish Tasks

```typescript
async function onPagePublished(page: SeoPage): Promise<void> {
  await Promise.all([
    // Revalidate Next.js cache
    revalidatePath(page.path),
    revalidatePath('/sitemap.xml'),
    
    // Update internal links on related pages
    updateInternalLinks(page),
    
    // Request Google indexing (if API enabled)
    requestIndexing(page.url),
    
    // Log publish event
    logPublishEvent(page),
    
    // Schedule first ranking check (24h later)
    scheduleRankingCheck(page, { delay: '24h' }),
  ]);
}
```

### 5.5 Key Files

```
/lib/seo/publishing/
  ├── index.ts                   # Main publish functions
  ├── drip.ts                    # Drip publishing logic
  ├── priority.ts                # Priority ordering
  ├── post-publish.ts            # Post-publish tasks
  └── scheduler.ts               # Scheduling helpers

/app/api/cron/seo-drip/
  └── route.ts                   # Cron endpoint
```

---

## 6. Page Rendering

### 6.1 Layout Components

```typescript
// Layout variant registry
const layoutVariants: Record<LayoutVariant, React.FC<PageProps>> = {
  'standard': StandardLayout,
  'problem-first': ProblemFirstLayout,
  'benefits-grid': BenefitsGridLayout,
  'testimonial-heavy': TestimonialHeavyLayout,
  'faq-heavy': FaqHeavyLayout,
  'story-flow': StoryFlowLayout,
};

// Section components (shared across layouts)
const sections = {
  Hero: HeroSection,
  Problem: ProblemSection,
  Solution: SolutionSection,
  Benefits: BenefitsSection,
  LocalContext: LocalContextSection,
  Testimonials: TestimonialsSection,
  Faq: FaqSection,
  Cta: CtaSection,
  InternalLinks: InternalLinksSection,
  TrustSignals: TrustSignalsSection,
};
```

### 6.2 Layout Variant Structures

| Variant | Section Order |
|---------|---------------|
| `standard` | Hero → Problem → Solution → Benefits → Trust → FAQ → CTA → Links |
| `problem-first` | Problem → Hero → Solution → Benefits → Trust → FAQ → CTA → Links |
| `benefits-grid` | Hero → Benefits (3-col grid) → Problem → Solution → Trust → FAQ → CTA → Links |
| `testimonial-heavy` | Hero → Testimonials → Problem → Solution → Benefits → FAQ → CTA → Links |
| `faq-heavy` | Hero → Problem → Solution → FAQ (expanded) → Benefits → CTA → Links |
| `story-flow` | Hero → LocalContext → Problem → Solution → Benefits → Testimonials → FAQ → CTA → Links |

### 6.3 Dynamic Route Structure

```
/app/
  ├── [service]/[location]/
  │   └── page.tsx               # service-location pages
  ├── services/[service]/
  │   └── page.tsx               # service-hub pages
  ├── industries/[industry]/
  │   ├── page.tsx               # industry national pages
  │   └── [location]/
  │       └── page.tsx           # industry-location pages
  ├── solutions/[problem]/
  │   └── page.tsx               # solution pages
  ├── compare/[tool]/
  │   └── page.tsx               # comparison pages
  └── locations/[location]/
      └── page.tsx               # location-hub pages
```

### 6.4 Page Template

```typescript
// app/[service]/[location]/page.tsx
import { notFound } from 'next/navigation';
import { getPageBySlug, getAllPublishedSlugs } from '@/lib/seo/queries';
import { SeoPageRenderer } from '@/lib/seo/components';

interface Props {
  params: { service: string; location: string };
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs('service-location');
  return slugs.map(slug => {
    const [service, location] = slug.split('/');
    return { service, location };
  });
}

export async function generateMetadata({ params }: Props) {
  const slug = `${params.service}/${params.location}`;
  const page = await getPageBySlug(slug);
  
  if (!page) return {};
  
  return {
    title: page.meta_title || page.content.heroHeadline,
    description: page.content.metaDescription,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${slug}`,
    },
  };
}

export default async function ServiceLocationPage({ params }: Props) {
  const slug = `${params.service}/${params.location}`;
  const page = await getPageBySlug(slug);
  
  if (!page || page.status !== 'published') {
    notFound();
  }
  
  return <SeoPageRenderer page={page} />;
}
```

### 6.5 Key Files

```
/lib/seo/components/
  ├── index.tsx                  # Main SeoPageRenderer
  ├── layouts/
  │   ├── StandardLayout.tsx
  │   ├── ProblemFirstLayout.tsx
  │   ├── BenefitsGridLayout.tsx
  │   ├── TestimonialHeavyLayout.tsx
  │   ├── FaqHeavyLayout.tsx
  │   └── StoryFlowLayout.tsx
  ├── sections/
  │   ├── HeroSection.tsx
  │   ├── ProblemSection.tsx
  │   ├── SolutionSection.tsx
  │   ├── BenefitsSection.tsx
  │   ├── FaqSection.tsx
  │   ├── CtaSection.tsx
  │   ├── InternalLinksSection.tsx
  │   └── TrustSignalsSection.tsx
  └── shared/
      ├── JsonLd.tsx
      └── Breadcrumbs.tsx
```

---

## 7. Technical SEO

### 7.1 Structured Data (JSON-LD)

```typescript
interface PageJsonLd {
  service: ServiceSchema;
  faq: FAQPageSchema;
  breadcrumb: BreadcrumbListSchema;
  organization: OrganizationSchema;
  localBusiness?: LocalBusinessSchema;  // For location pages
}

function buildJsonLd(page: SeoPage, context: PageContext): PageJsonLd {
  return {
    service: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: page.content.heroHeadline,
      description: page.content.metaDescription,
      provider: {
        '@type': 'LocalBusiness',
        name: context.business.name,
        // ... more fields
      },
      areaServed: context.location ? {
        '@type': 'City',
        name: context.location.name,
      } : undefined,
    },
    faq: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.content.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    breadcrumb: buildBreadcrumbSchema(page),
    organization: buildOrganizationSchema(context),
  };
}
```

### 7.2 Canonical URL Management

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Normalize path (remove trailing slash, lowercase)
  let canonicalPath = request.nextUrl.pathname
    .toLowerCase()
    .replace(/\/+$/, '');
  
  // Set header for page to read
  response.headers.set('x-canonical-path', canonicalPath);
  
  return response;
}
```

### 7.3 Dynamic Sitemap

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllPublishedPages } from '@/lib/seo/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];
  
  // Dynamic SEO pages
  const seoPages = await getAllPublishedPages();
  const seoRoutes: MetadataRoute.Sitemap = seoPages.map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updated_at,
    changeFrequency: 'monthly',
    priority: getPriority(page.route_pattern, page.location_tier),
  }));
  
  return [...staticRoutes, ...seoRoutes];
}

function getPriority(pattern: RoutePattern, tier?: number): number {
  const basePriority: Record<RoutePattern, number> = {
    'service-location': 0.8,
    'service-hub': 0.9,
    'industry': 0.7,
    'industry-location': 0.6,
    'solution': 0.7,
    'comparison': 0.7,
    'location-hub': 0.6,
  };
  
  let priority = basePriority[pattern] || 0.5;
  
  // Tier adjustment
  if (tier === 1) priority += 0.05;
  if (tier === 3) priority -= 0.05;
  
  return Math.min(1.0, Math.max(0.1, priority));
}
```

### 7.4 OG Image Generation

```typescript
// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Default Title';
  const description = searchParams.get('description') || '';
  const type = searchParams.get('type') || 'default';
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '60px',
        }}
      >
        <div style={{ color: '#f8fafc', fontSize: 60, fontWeight: 'bold' }}>
          {title}
        </div>
        {description && (
          <div style={{ color: '#94a3b8', fontSize: 30, marginTop: 20 }}>
            {description}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### 7.5 Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### 7.6 Key Files

```
/lib/seo/technical/
  ├── json-ld.ts                 # Schema builders
  ├── canonical.ts               # Canonical URL helpers
  ├── meta.ts                    # Meta tag builders
  └── og-image.ts                # OG image URL builder

/app/
  ├── sitemap.ts
  ├── robots.ts
  └── api/og/route.tsx
```

---

## 8. SERP Tracking

### 8.1 Tracking Configuration

```typescript
interface SerpConfig {
  provider: 'serpapi' | 'serper' | 'valueserp';
  
  // Search parameters
  engine: 'google';
  country: string;               // 'au', 'us', 'uk'
  language: string;              // 'en'
  location?: string;             // 'Adelaide, South Australia'
  numResults: number;            // 100
  device: 'desktop' | 'mobile';
  
  // Scheduling
  checkFrequency: 'daily' | 'weekly';
  pagesPerRun: number;           // Rate limit management
  
  // Storage
  storeRawSerp: boolean;         // Store full SERP data
  retentionDays: number;         // How long to keep history
}
```

### 8.2 Keyword Derivation

```typescript
interface KeywordDerivation {
  method: 'slug' | 'meta-title' | 'custom';
  
  // For slug method
  slugTransform?: {
    separator: '-' | '_';
    removePatterns?: RegExp[];
    locationHandling: 'include' | 'exclude' | 'suffix';
  };
}

// Example: "interior-painting-henley-beach" → "interior painting henley beach"
function deriveKeywordFromSlug(slug: string, config: KeywordDerivation): string {
  let keyword = slug.replace(/-/g, ' ');
  
  // Remove route pattern prefixes if present
  config.slugTransform?.removePatterns?.forEach(pattern => {
    keyword = keyword.replace(pattern, '');
  });
  
  return keyword.trim();
}
```

### 8.3 SERP Check Logic

```typescript
interface SerpCheckResult {
  keyword: string;
  position: number | null;       // null = not in top N
  url: string | null;            // Which URL ranked
  featuredSnippet: boolean;
  localPack: boolean;
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  checkedAt: string;
  rawData?: object;              // Full SERP if storeRawSerp=true
}

async function checkKeywordRanking(
  keyword: string,
  domain: string,
  config: SerpConfig
): Promise<SerpCheckResult> {
  const response = await serpApi.search({
    q: keyword,
    engine: config.engine,
    gl: config.country,
    hl: config.language,
    location: config.location,
    num: config.numResults,
    device: config.device,
  });
  
  // Find our domain in results
  const position = findDomainPosition(response.organic_results, domain);
  const url = position ? response.organic_results[position - 1].link : null;
  
  return {
    keyword,
    position,
    url,
    featuredSnippet: !!response.answer_box?.link?.includes(domain),
    localPack: response.local_results?.some(r => r.link?.includes(domain)) || false,
    peopleAlsoAsk: response.related_questions?.map(q => q.question) || [],
    relatedSearches: response.related_searches?.map(s => s.query) || [],
    checkedAt: new Date().toISOString(),
    rawData: config.storeRawSerp ? response : undefined,
  };
}
```

### 8.4 Stats Aggregation (Database Trigger)

```sql
-- Trigger function to auto-update seo_page_stats
CREATE OR REPLACE FUNCTION update_seo_page_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO seo_page_stats (
    page_id,
    latest_position,
    best_position,
    avg_position_7d,
    avg_position_30d,
    check_count,
    first_checked_at,
    last_checked_at,
    last_position_change,
    days_in_top_10,
    days_in_top_3
  )
  VALUES (
    NEW.page_id,
    NEW.position,
    NEW.position,
    NEW.position,
    NEW.position,
    1,
    NEW.checked_at,
    NEW.checked_at,
    0,
    CASE WHEN NEW.position <= 10 THEN 1 ELSE 0 END,
    CASE WHEN NEW.position <= 3 THEN 1 ELSE 0 END
  )
  ON CONFLICT (page_id) DO UPDATE SET
    latest_position = NEW.position,
    best_position = LEAST(
      COALESCE(seo_page_stats.best_position, NEW.position),
      COALESCE(NEW.position, seo_page_stats.best_position)
    ),
    avg_position_7d = (
      SELECT AVG(position)
      FROM seo_ranking_snapshots
      WHERE page_id = NEW.page_id
        AND position IS NOT NULL
        AND checked_at > NOW() - INTERVAL '7 days'
    ),
    avg_position_30d = (
      SELECT AVG(position)
      FROM seo_ranking_snapshots
      WHERE page_id = NEW.page_id
        AND position IS NOT NULL
        AND checked_at > NOW() - INTERVAL '30 days'
    ),
    check_count = seo_page_stats.check_count + 1,
    last_checked_at = NEW.checked_at,
    last_position_change = COALESCE(seo_page_stats.latest_position, 0) - COALESCE(NEW.position, 0),
    days_in_top_10 = seo_page_stats.days_in_top_10 + 
      CASE WHEN NEW.position <= 10 THEN 1 ELSE 0 END,
    days_in_top_3 = seo_page_stats.days_in_top_3 + 
      CASE WHEN NEW.position <= 3 THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ranking_snapshot_insert
  AFTER INSERT ON seo_ranking_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_page_stats();
```

### 8.5 Key Files

```
/lib/seo/serp/
  ├── index.ts                   # Main check function
  ├── providers/
  │   ├── serpapi.ts
  │   ├── serper.ts
  │   └── valueserp.ts
  ├── keyword-derivation.ts
  ├── result-parser.ts
  └── types.ts

/app/api/cron/serp-check/
  └── route.ts
```

---

## 9. Dashboard & Analytics

### 9.1 KPI Cards

| Card | Metric | Calculation |
|------|--------|-------------|
| **Published Pages** | X / Y | Published count / Total generated |
| **Avg Position** | X.X | Mean of all latest positions (excluding nulls) |
| **Top 3 Count** | X (Y%) | Pages with position ≤ 3 / Total tracked |
| **Top 10 Count** | X (Y%) | Pages with position ≤ 10 / Total tracked |
| **Top 20 Count** | X (Y%) | Pages with position ≤ 20 / Total tracked |
| **Not Ranking** | X (Y%) | Pages with null position / Total tracked |
| **Pages Ranking** | X (Y%) | Pages with any position / Total published |
| **Est. Completion** | Date | (Total - Published) / Drip rate |

### 9.2 Charts

#### Position Trend Chart (Line)
- X-axis: Date (filterable: 7d, 30d, 90d, all)
- Y-axis: Position (inverted, 1 at top)
- Series: Average position per day
- Optional: Individual page overlay

#### Position Distribution Chart (Bar)
- Buckets: 1-3, 4-10, 11-20, 21-50, 51-100, Not Ranked
- Color coded: Green → Yellow → Red → Gray

#### Publishing Progress Chart (Area)
- X-axis: Date
- Y-axis: Cumulative published count
- Projected completion line

#### Route Pattern Breakdown (Stacked Bar)
- X-axis: Route pattern
- Stacked: Published (green) vs Draft (gray)

### 9.3 Rankings Table

| Column | Description | Sortable | Filterable |
|--------|-------------|----------|------------|
| Keyword | Derived or custom keyword | ✓ | Search |
| Page Title | Meta title or hero headline | ✓ | Search |
| Current Position | Latest ranking | ✓ | Buckets |
| Best Position | All-time best | ✓ | |
| 7d Avg | Rolling average | ✓ | |
| 7d Change | Position delta (with arrow) | ✓ | Improved/Declined |
| Trend | Sparkline (7 data points) | | |
| Last Checked | Timestamp | ✓ | |
| Actions | View page, Force check | | |

#### Table Filters
- **Position buckets**: All, Top 3, Top 10, Top 20, 50+, Not Ranked
- **Route pattern**: service-location, industry, etc.
- **Location tier**: 1, 2, 3
- **Status**: Improving, Stable, Declining

### 9.4 Top Movers Panel

```typescript
interface MoverData {
  page: SeoPage;
  currentPosition: number;
  previousPosition: number;      // 7 days ago
  change: number;                // Positive = improved
  changePercent: number;
}

// Top 5 improvers (biggest positive change)
// Top 5 decliners (biggest negative change)
```

### 9.5 Content Pipeline Panel

| Metric | Value |
|--------|-------|
| Total Pages | X |
| Published | X |
| Approved (queued) | X |
| Pending Review | X |
| Draft | X |
| Rejected | X |
| Drip Rate | X/day |
| Est. Completion | Date |

#### Breakdown Table
| Route Pattern | Tier 1 | Tier 2 | Tier 3 | Total | Published |
|---------------|--------|--------|--------|-------|-----------|
| service-location | X | X | X | X | X |
| ... | ... | ... | ... | ... | ... |

### 9.6 Key Files

```
/app/admin/seo-dashboard/
  ├── page.tsx                   # Main dashboard
  ├── actions/
  │   ├── rankings.ts            # Server actions for ranking data
  │   ├── pipeline.ts            # Server actions for pipeline data
  │   └── keywords.ts            # Server actions for keyword mgmt
  └── components/
      ├── KPICards.tsx
      ├── PositionTrendChart.tsx
      ├── DistributionChart.tsx
      ├── PublishingProgressChart.tsx
      ├── RankingsTable.tsx
      ├── TopMovers.tsx
      ├── PipelineStatus.tsx
      └── RouteBreakdown.tsx
```

---

## 10. Keyword Management

### 10.1 Keyword Sources

| Source | Description |
|--------|-------------|
| **Auto-derived** | Generated from page slug |
| **Custom** | Manually added keywords |
| **Suggested** | AI-recommended based on content |

### 10.2 Keyword Schema

```typescript
interface TrackedKeyword {
  id: string;
  pageId?: string;               // Optional link to page
  siteId: string;                // For multi-site support
  
  keyword: string;
  source: 'auto' | 'custom' | 'suggested';
  
  // Tracking config
  active: boolean;
  priority: 'high' | 'medium' | 'low';
  checkFrequency?: 'daily' | 'weekly';
  
  // Metadata
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  
  createdAt: string;
  updatedAt: string;
}
```

### 10.3 Bulk Operations

```typescript
// Bulk add keywords
POST /api/admin/keywords
{
  "siteId": "uuid",
  "keywords": ["keyword 1", "keyword 2"],
  "source": "custom",
  "priority": "medium"
}

// Bulk delete
DELETE /api/admin/keywords
{
  "ids": ["uuid1", "uuid2"]
}

// Bulk update priority
PATCH /api/admin/keywords
{
  "ids": ["uuid1", "uuid2"],
  "priority": "high"
}
```

### 10.4 Keyword Suggestions

```typescript
async function suggestKeywords(pageId: string): Promise<string[]> {
  const page = await getPage(pageId);
  
  // Extract potential keywords from content
  const candidates = [
    ...extractNGrams(page.content.heroHeadline, [2, 3, 4]),
    ...extractNGrams(page.content.problemStatement, [2, 3, 4]),
    ...page.content.faq.flatMap(f => extractNGrams(f.question, [3, 4, 5])),
  ];
  
  // Dedupe and filter
  const unique = [...new Set(candidates)]
    .filter(k => k.split(' ').length >= 2)
    .filter(k => !stopWords.some(sw => k.includes(sw)));
  
  return unique.slice(0, 10);
}
```

---

## 11. Internal Linking

### 11.1 Linking Strategy

```typescript
interface InternalLinkConfig {
  maxLinksPerSection: number;    // Default: 3
  linkTypes: {
    sameServiceOtherLocations: boolean;
    sameLocationOtherServices: boolean;
    relatedRoutePatterns: boolean;
    parentHub: boolean;
  };
  
  // Prioritization
  priorityFactors: {
    sameServiceWeight: number;
    sameTierWeight: number;
    publishedRecentlyWeight: number;
    highRankingWeight: number;
  };
}
```

### 11.2 Link Generation

```typescript
interface InternalLink {
  url: string;
  anchor: string;
  relevanceScore: number;
  relationship: 'same-service' | 'same-location' | 'related' | 'parent-hub';
}

async function generateInternalLinks(
  page: SeoPage,
  config: InternalLinkConfig
): Promise<InternalLink[]> {
  const links: InternalLink[] = [];
  
  // Same service, other locations
  if (config.linkTypes.sameServiceOtherLocations && page.service_slug) {
    const related = await db
      .from('seo_pages')
      .select('*')
      .eq('status', 'published')
      .eq('service_slug', page.service_slug)
      .neq('id', page.id)
      .order('location_tier', { ascending: true })
      .limit(config.maxLinksPerSection);
    
    links.push(...related.map(r => ({
      url: `/${r.slug}`,
      anchor: `${page.service_name} in ${r.location_name}`,
      relevanceScore: calculateRelevance(page, r, config),
      relationship: 'same-service',
    })));
  }
  
  // Same location, other services
  if (config.linkTypes.sameLocationOtherServices && page.location_slug) {
    // Similar logic...
  }
  
  // Parent hub
  if (config.linkTypes.parentHub) {
    // Link to /services/{service} or /locations/{location}
  }
  
  // Sort by relevance and dedupe
  return links
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, config.maxLinksPerSection * 3);
}
```

### 11.3 Link Health Monitoring

```typescript
interface LinkHealth {
  pageId: string;
  outboundLinks: number;
  inboundLinks: number;
  brokenLinks: number;
  orphanPage: boolean;           // No inbound links
  lastCheckedAt: string;
}

// Cron job to check link health
async function checkLinkHealth(): Promise<void> {
  const pages = await getAllPublishedPages();
  
  for (const page of pages) {
    const inbound = await countInboundLinks(page.id);
    const outbound = await countOutboundLinks(page.id);
    const broken = await findBrokenLinks(page.id);
    
    await upsertLinkHealth({
      pageId: page.id,
      inboundLinks: inbound,
      outboundLinks: outbound,
      brokenLinks: broken.length,
      orphanPage: inbound === 0,
      lastCheckedAt: new Date().toISOString(),
    });
  }
}
```

---

## 12. Alert System

### 12.1 Alert Types

| Alert | Trigger | Severity |
|-------|---------|----------|
| `ranking_drop` | Position drops >5 places in 7 days | Warning |
| `ranking_lost` | Position goes from ranked to null | Critical |
| `deindexed` | Page removed from Google index | Critical |
| `publish_failed` | Drip publish job failed | Critical |
| `quality_gate_spike` | >50% of batch fails quality gate | Warning |
| `api_quota` | SERP API usage >80% | Warning |
| `orphan_page` | Published page has 0 inbound links | Info |

### 12.2 Alert Schema

```typescript
interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  
  title: string;
  message: string;
  
  // Context
  pageId?: string;
  keywordId?: string;
  metadata?: Record<string, unknown>;
  
  // State
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  
  // Notification
  notificationSent: boolean;
  notificationChannels: ('email' | 'slack' | 'webhook')[];
  
  createdAt: string;
}
```

### 12.3 Notification Channels

```typescript
interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    minSeverity: 'info' | 'warning' | 'critical';
  };
  
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    minSeverity: 'info' | 'warning' | 'critical';
  };
  
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
}
```

### 12.4 Alert Dashboard Component

```typescript
// In dashboard
<AlertsPanel
  alerts={activeAlerts}
  onAcknowledge={handleAcknowledge}
  onResolve={handleResolve}
  filters={['severity', 'type', 'status']}
/>
```

---

## 13. Google Search Console Integration

### 13.1 Data to Fetch

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Clicks** | Actual traffic to page | ROI measurement |
| **Impressions** | Times shown in search | Visibility tracking |
| **CTR** | Click-through rate | Title/description optimization |
| **Position** | Google's reported position | Cross-reference with SERP API |
| **Queries** | Keywords driving traffic | Keyword discovery |
| **Indexing Status** | Indexed/not indexed | Technical SEO |

### 13.2 GSC Integration

```typescript
interface GSCConfig {
  propertyUrl: string;           // 'sc-domain:example.com'
  credentials: {
    type: 'service_account';
    // ... Google service account JSON
  };
  
  syncFrequency: 'daily' | 'weekly';
  dataRetentionDays: number;
}

interface GSCPageData {
  pageId: string;
  url: string;
  date: string;
  
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  
  // Top queries for this page
  queries: {
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
}
```

### 13.3 Indexing API Integration

```typescript
// Request indexing for newly published pages
async function requestIndexing(url: string): Promise<void> {
  await google.indexing('v3').urlNotifications.publish({
    requestBody: {
      url,
      type: 'URL_UPDATED',
    },
  });
}

// Check indexing status
async function checkIndexingStatus(url: string): Promise<'indexed' | 'pending' | 'error'> {
  const result = await google.searchconsole('v1').urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      siteUrl: process.env.GSC_PROPERTY_URL,
    },
  });
  
  return result.data.inspectionResult?.indexStatusResult?.coverageState || 'error';
}
```

---

## 14. Content Lifecycle Management

### 14.1 Content Refresh

```typescript
interface RefreshConfig {
  // Auto-refresh triggers
  autoRefresh: {
    enabled: boolean;
    triggers: {
      rankingDrop: number;       // Refresh if drops > N positions
      ageMonths: number;         // Refresh if older than N months
      lowCtr: number;            // Refresh if CTR < N%
    };
  };
  
  // Refresh strategy
  strategy: 'full' | 'partial';  // Regenerate all or just update sections
  preserveFields: string[];      // Fields to keep (e.g., 'faq')
}
```

### 14.2 Content Versioning

```typescript
interface ContentVersion {
  id: string;
  pageId: string;
  version: number;
  
  content: SeoContent;
  qualityScore: number;
  
  // Performance at time of version
  snapshotMetrics: {
    position?: number;
    clicks?: number;
    impressions?: number;
  };
  
  createdAt: string;
  createdBy: 'ai' | 'human' | 'refresh';
  
  // Comparison
  diffFromPrevious?: object;
}
```

### 14.3 Scheduled Publishing

```typescript
interface ScheduledPublish {
  pageId: string;
  scheduledFor: string;          // ISO timestamp
  
  // Optional: coordinate with other pages
  batchId?: string;              // Publish together
  dependsOn?: string[];          // Publish after these pages
}
```

### 14.4 Bulk Operations

```typescript
// Bulk status update
async function bulkUpdateStatus(
  pageIds: string[],
  status: PageStatus,
  options?: { scheduledFor?: string }
): Promise<void>;

// Bulk regenerate
async function bulkRegenerate(
  filter: {
    routePattern?: RoutePattern;
    locationTier?: number;
    olderThan?: string;
    status?: PageStatus;
  },
  options?: { preserveFields?: string[] }
): Promise<void>;

// Bulk archive
async function bulkArchive(pageIds: string[]): Promise<void>;
```

---

## 15. Database Schema

### 15.1 Complete Schema

```sql
-- Locations (cities, suburbs, regions)
CREATE TABLE seo_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city', 'suburb', 'region', 'state')),
  
  parent_id UUID REFERENCES seo_locations(id),
  
  tier SMALLINT NOT NULL CHECK (tier IN (1, 2, 3)),
  tier_reason TEXT,
  
  state TEXT,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_coastal BOOLEAN DEFAULT FALSE,
  
  median_property_price INTEGER,
  predominant_housing_era TEXT,
  architectural_style TEXT,
  demographic_notes TEXT,
  nearby_landmarks JSONB DEFAULT '[]',
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services/Entities
CREATE TABLE seo_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  
  category TEXT,
  tags JSONB DEFAULT '[]',
  
  target_audience TEXT,
  pain_points JSONB DEFAULT '[]',
  unique_selling_points JSONB DEFAULT '[]',
  
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industries
CREATE TABLE seo_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pain_points JSONB DEFAULT '[]',
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solutions
CREATE TABLE seo_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  problem_description TEXT,
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparisons
CREATE TABLE seo_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_weaknesses JSONB DEFAULT '[]',
  our_advantages JSONB DEFAULT '[]',
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main SEO Pages
CREATE TABLE seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  slug TEXT UNIQUE NOT NULL,
  route_pattern TEXT NOT NULL,
  
  -- Foreign keys (nullable based on route pattern)
  service_id UUID REFERENCES seo_services(id),
  location_id UUID REFERENCES seo_locations(id),
  industry_id UUID REFERENCES seo_industries(id),
  solution_id UUID REFERENCES seo_solutions(id),
  comparison_id UUID REFERENCES seo_comparisons(id),
  
  -- Denormalized for queries
  service_slug TEXT,
  location_slug TEXT,
  location_tier SMALLINT,
  
  -- Content
  content JSONB NOT NULL,
  layout TEXT DEFAULT 'standard',
  
  -- SEO Meta (can override content)
  meta_title TEXT,
  meta_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'archived', 'rejected')
  ),
  rejection_reason TEXT,
  
  -- Quality
  quality_score INTEGER,
  quality_errors JSONB DEFAULT '[]',
  quality_warnings JSONB DEFAULT '[]',
  quality_checked_at TIMESTAMPTZ,
  
  -- Scheduling
  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  content_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content versions (for history)
CREATE TABLE seo_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  
  content JSONB NOT NULL,
  quality_score INTEGER,
  
  snapshot_metrics JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'ai',
  
  UNIQUE(page_id, version)
);

-- Tracked sites (for multi-site support)
CREATE TABLE seo_tracked_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracked keywords
CREATE TABLE seo_tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES seo_tracked_sites(id) ON DELETE CASCADE,
  page_id UUID REFERENCES seo_pages(id) ON DELETE SET NULL,
  
  keyword TEXT NOT NULL,
  source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'custom', 'suggested')),
  
  active BOOLEAN DEFAULT TRUE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  check_frequency TEXT DEFAULT 'daily',
  
  search_volume INTEGER,
  difficulty INTEGER,
  cpc DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, keyword)
);

-- Ranking snapshots (historical)
CREATE TABLE seo_ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES seo_tracked_keywords(id) ON DELETE CASCADE,
  page_id UUID REFERENCES seo_pages(id) ON DELETE SET NULL,
  
  position INTEGER,              -- NULL = not in top N
  url TEXT,                      -- Which URL ranked
  
  featured_snippet BOOLEAN DEFAULT FALSE,
  local_pack BOOLEAN DEFAULT FALSE,
  
  raw_data JSONB,                -- Full SERP data
  
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite index for time-series queries
  UNIQUE(keyword_id, checked_at)
);

-- Aggregated page stats (auto-updated by trigger)
CREATE TABLE seo_page_stats (
  page_id UUID PRIMARY KEY REFERENCES seo_pages(id) ON DELETE CASCADE,
  
  latest_position INTEGER,
  best_position INTEGER,
  worst_position INTEGER,
  
  avg_position_7d DECIMAL(5, 2),
  avg_position_30d DECIMAL(5, 2),
  
  check_count INTEGER DEFAULT 0,
  first_checked_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  
  last_position_change INTEGER,
  
  days_in_top_3 INTEGER DEFAULT 0,
  days_in_top_10 INTEGER DEFAULT 0,
  days_in_top_20 INTEGER DEFAULT 0,
  
  -- GSC data
  total_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  avg_ctr DECIMAL(5, 4),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GSC data (daily snapshots)
CREATE TABLE seo_gsc_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(5, 4),
  position DECIMAL(5, 2),
  
  top_queries JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(page_id, date)
);

-- Alerts
CREATE TABLE seo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  page_id UUID REFERENCES seo_pages(id) ON DELETE SET NULL,
  keyword_id UUID REFERENCES seo_tracked_keywords(id) ON DELETE SET NULL,
  metadata JSONB,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,
  
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_channels JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal link tracking
CREATE TABLE seo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  source_page_id UUID NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
  
  anchor_text TEXT,
  relationship TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(source_page_id, target_page_id)
);

-- Link health stats
CREATE TABLE seo_link_health (
  page_id UUID PRIMARY KEY REFERENCES seo_pages(id) ON DELETE CASCADE,
  
  outbound_links INTEGER DEFAULT 0,
  inbound_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  orphan_page BOOLEAN DEFAULT FALSE,
  
  last_checked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration
CREATE TABLE seo_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_seo_pages_status ON seo_pages(status);
CREATE INDEX idx_seo_pages_route_pattern ON seo_pages(route_pattern);
CREATE INDEX idx_seo_pages_location_tier ON seo_pages(location_tier);
CREATE INDEX idx_seo_pages_published_at ON seo_pages(published_at);
CREATE INDEX idx_seo_ranking_snapshots_keyword_date ON seo_ranking_snapshots(keyword_id, checked_at DESC);
CREATE INDEX idx_seo_ranking_snapshots_page ON seo_ranking_snapshots(page_id);
CREATE INDEX idx_seo_alerts_status ON seo_alerts(status);
CREATE INDEX idx_seo_alerts_created ON seo_alerts(created_at DESC);
```

### 15.2 Row Level Security

```sql
-- Public: Read published pages only
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published pages"
  ON seo_pages FOR SELECT
  TO anon
  USING (status = 'published');

-- Authenticated: Read all pages
CREATE POLICY "Authenticated can read all pages"
  ON seo_pages FOR SELECT
  TO authenticated
  USING (true);

-- Service role: Full access
CREATE POLICY "Service role has full access"
  ON seo_pages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Similar policies for other tables...
```

---

## 16. API Endpoints

### 16.1 Public API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seo/page/[slug]` | GET | Get published page by slug |
| `/api/sitemap.xml` | GET | Dynamic sitemap |
| `/api/og` | GET | OG image generation |

### 16.2 Admin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/pages` | GET | List all pages (with filters) |
| `/api/admin/pages` | POST | Create page manually |
| `/api/admin/pages/[id]` | GET | Get page by ID |
| `/api/admin/pages/[id]` | PATCH | Update page |
| `/api/admin/pages/[id]` | DELETE | Delete page |
| `/api/admin/pages/[id]/publish` | POST | Publish single page |
| `/api/admin/pages/[id]/approve` | POST | Approve page |
| `/api/admin/pages/[id]/reject` | POST | Reject page |
| `/api/admin/pages/[id]/regenerate` | POST | Regenerate content |
| `/api/admin/pages/bulk` | POST | Bulk operations |
| `/api/admin/keywords` | GET | List tracked keywords |
| `/api/admin/keywords` | POST | Add keywords |
| `/api/admin/keywords` | DELETE | Delete keywords |
| `/api/admin/keywords/[id]/check` | POST | Force ranking check |
| `/api/admin/rankings` | GET | Get ranking history |
| `/api/admin/rankings/summary` | GET | Get ranking summary stats |
| `/api/admin/pipeline/stats` | GET | Get pipeline statistics |
| `/api/admin/alerts` | GET | List alerts |
| `/api/admin/alerts/[id]/acknowledge` | POST | Acknowledge alert |
| `/api/admin/alerts/[id]/resolve` | POST | Resolve alert |
| `/api/admin/config` | GET | Get configuration |
| `/api/admin/config` | PATCH | Update configuration |

### 16.3 Cron API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cron/seo-drip` | POST | CRON_SECRET | Drip publish |
| `/api/cron/serp-check` | POST | CRON_SECRET | SERP ranking check |
| `/api/cron/gsc-sync` | POST | CRON_SECRET | GSC data sync |
| `/api/cron/link-health` | POST | CRON_SECRET | Link health check |
| `/api/cron/generate` | POST | CRON_SECRET | Generate content |

---

## 17. Cron Jobs

### 17.1 Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| `seo-drip` | `0 2 * * *` (2 AM UTC) | Publish approved pages |
| `serp-check` | `0 5 * * *` (5 AM UTC) | Check keyword rankings |
| `gsc-sync` | `0 6 * * *` (6 AM UTC) | Sync GSC data |
| `link-health` | `0 7 * * 0` (7 AM UTC Sunday) | Check internal links |
| `content-refresh` | `0 3 * * 0` (3 AM UTC Sunday) | Identify stale content |

### 17.2 Vercel Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/seo-drip",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/serp-check",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/gsc-sync",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/link-health",
      "schedule": "0 7 * * 0"
    },
    {
      "path": "/api/cron/content-refresh",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

---

## 18. Environment & Config

### 18.1 Environment Variables

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# SERP Tracking
SERPAPI_KEY=                     # Or store in DB config

# Google APIs
GOOGLE_SERVICE_ACCOUNT_JSON=     # Base64 encoded
GSC_PROPERTY_URL=                # sc-domain:example.com

# Cron Authentication
CRON_SECRET=

# Site
NEXT_PUBLIC_SITE_URL=

# Notifications (optional)
SLACK_WEBHOOK_URL=
ALERT_EMAIL_RECIPIENTS=
```

### 18.2 Database Configuration

```sql
-- Insert default config
INSERT INTO seo_config (key, value) VALUES
  ('drip', '{
    "enabled": true,
    "pagesPerRun": 5,
    "requireQualityGate": true,
    "minQualityScore": 80
  }'),
  ('serp', '{
    "provider": "serpapi",
    "country": "au",
    "language": "en",
    "numResults": 100,
    "pagesPerRun": 10
  }'),
  ('quality_gate', '{
    "blockingRulesEnabled": true,
    "warningRulesEnabled": true
  }'),
  ('business', '{
    "name": "Your Business Name",
    "ownerName": "Your Name",
    "pronounStyle": "first-person-singular",
    "googleRating": 5.0,
    "reviewCount": 50
  }'),
  ('notifications', '{
    "email": { "enabled": false },
    "slack": { "enabled": false }
  }');
```

---

## 19. Security

### 19.1 Authentication

| Context | Method |
|---------|--------|
| **Public pages** | None (read-only) |
| **Admin dashboard** | Supabase Auth (magic link or OAuth) |
| **Admin API** | Supabase Auth session |
| **Cron endpoints** | Bearer token (`CRON_SECRET`) |

### 19.2 Cron Authentication

```typescript
// Middleware for cron routes
export function validateCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.split(' ')[1];
  return token === process.env.CRON_SECRET;
}
```

### 19.3 Sensitive Data

| Data | Storage | Access |
|------|---------|--------|
| SERP API key | Database `seo_config` | Service role only |
| Google credentials | Environment variable | Server-side only |
| Business info | Database `seo_config` | Authenticated users |

---

## 20. Export & Reporting

### 20.1 Export Formats

| Format | Use Case |
|--------|----------|
| CSV | Spreadsheet analysis |
| JSON | API integration |
| PDF | Client reports |

### 20.2 Export Endpoints

```typescript
// Export rankings data
GET /api/admin/export/rankings?format=csv&dateRange=30d

// Export pages data
GET /api/admin/export/pages?format=csv&status=published

// Generate PDF report
POST /api/admin/export/report
{
  "type": "monthly",
  "dateRange": "2024-01",
  "sections": ["summary", "rankings", "traffic", "recommendations"]
}
```

### 20.3 Scheduled Reports

```typescript
interface ScheduledReport {
  id: string;
  name: string;
  type: 'weekly' | 'monthly';
  sections: string[];
  recipients: string[];
  format: 'pdf' | 'csv';
  enabled: boolean;
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Database schema migration
- [ ] Location/service data seeding
- [ ] Content generation pipeline
- [ ] Quality gate system
- [ ] Basic page rendering

### Phase 2: Publishing Pipeline
- [ ] Drip publishing system
- [ ] Priority ordering logic
- [ ] Post-publish tasks
- [ ] Sitemap generation

### Phase 3: Layout Variants
- [ ] Standard layout
- [ ] Problem-first layout
- [ ] Benefits-grid layout
- [ ] Testimonial-heavy layout
- [ ] FAQ-heavy layout
- [ ] Story-flow layout

### Phase 4: SERP Tracking
- [ ] SERP provider integration
- [ ] Ranking snapshots storage
- [ ] Stats aggregation trigger
- [ ] Keyword management UI

### Phase 5: Dashboard
- [ ] KPI cards
- [ ] Position trend chart
- [ ] Distribution chart
- [ ] Rankings table with filters
- [ ] Top movers panel
- [ ] Pipeline status panel

### Phase 6: Advanced Features
- [ ] Internal linking system
- [ ] Alert system
- [ ] GSC integration
- [ ] Content versioning
- [ ] Scheduled publishing
- [ ] Export/reporting

### Phase 7: Optimization
- [ ] Link health monitoring
- [ ] Content refresh system
- [ ] A/B testing framework
- [ ] Performance monitoring

---