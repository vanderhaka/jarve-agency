# Unified pSEO System Specification v1.0

> The definitive feature set for programmatic SEO projects. Apply to any business vertical.

## Implementation Status

This spec reflects the **actual codebase** with clear markers for what's implemented vs planned:

- ✅ **Implemented** - Fully working in production
- 🚧 **Partial** - Some features working, others planned
- 📋 **Planned** - Documented but not yet built

### Quick Facts

**Database:**
- ✅ `seo_pages` table with `city_tier` (1-2 only)
- ✅ Rank tracker tables: `tracked_sites`, `tracked_keywords`, `ranking_history` (no `seo_` prefix)
- 📋 Entity tables planned (data lives in TS files: `lib/seo/cities.ts`, etc.)

**Content:**
- ✅ 15 cities (5 tier-1, 10 tier-2)
- ✅ 6 services, 12 industries
- ✅ 5 route patterns: `services-city`, `industries`, `industries-city`, `solutions`, `comparisons`
- ✅ Content generation pipeline with quality gate

**Publishing:**
- ✅ Drip publishing with city tier ordering
- ✅ Status: `draft` → `published` (no approval workflow yet)

**Tracking:**
- ✅ SERP tracking via cron (`api/cron/serp-check`)
- ✅ Ranking history storage with `date DATE` (not `checked_at`)
- ✅ Dashboard with stats and rankings table
- 📋 GSC integration planned

**Internal Linking:**
- ✅ Basic internal link generation (`lib/seo/internal-links.ts`)
- 📋 Link health monitoring planned

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

## 1. Content Generation Pipeline ✅

### 1.1 Generation Engine ✅

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

# Generate specific city
pnpm seo generate --city "sydney"

# Regenerate existing drafts
pnpm seo generate --regenerate --pattern comparisons

# Resume from specific slug
pnpm seo generate --after "services/mvp-development/sydney"
```

### 1.4 Generation Prompt Template

```typescript
interface GenerationContext {
  // Required
  pageType: RoutePattern;
  primaryEntity: string;        // Service, industry, solution, etc.

  // City (optional - for city-specific pages)
  city?: {
    name: string;
    tier: 1 | 2;                // Only tier 1 or 2
  };

  // Business context
  business: {
    name: string;
    ownerName: string;
    pronounStyle: 'first-person-singular' | 'first-person-plural';
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

## 2. Content Structure & Types ✅

### 2.1 Universal Content Schema ✅

```typescript
interface SeoContent {
  // Hero Section
  heroHeadline: string;          // Max 8 words
  heroSubheadline: string;       // Max 20 words

  // Context Section (for city-specific pages)
  cityContext?: string;          // City-specific context

  // Problem/Solution Section
  problemStatement: string;      // Customer pain points
  solution: string;              // How we solve it

  // Benefits Section
  benefits: {
    title: string;
    description: string;
  }[];                           // Array of benefits

  // Trust Signals (for city pages)
  localSignals?: string[];       // City-specific trust signals

  // Call to Action
  ctaText: string;               // Button text

  // FAQ Section
  faq: {
    question: string;
    answer: string;
  }[];

  // SEO Meta
  metaDescription?: string;      // Meta description

  // Layout & Display
  layout?: LayoutVariant;        // Default: 'standard'

  // Social Proof
  testimonialMatch?: string;     // Ideal testimonial description
}

type LayoutVariant =
  | 'standard'           // Default balanced layout
  | 'problem-first'      // Lead with pain points
  | 'benefits-grid'      // Visual benefits emphasis
  | 'faq-heavy'          // Educational/informational
  | 'story-flow';        // Narrative structure
```

### 2.2 Route Patterns

| Pattern | URL Structure | Example | Use Case |
|---------|---------------|---------|----------|
| `services-city` ✅ | `/services/{service}/{city}` | `/services/mvp-development/sydney` | Core service pages |
| `industries` ✅ | `/industries/{industry}` | `/industries/healthcare` | B2B verticals |
| `industries-city` ✅ | `/industries/{industry}/{city}` | `/industries/retail/sydney` | B2B + geo |
| `solutions` ✅ | `/solutions/{problem}` | `/solutions/legacy-system-replacement` | Problem-focused |
| `comparisons` ✅ | `/compare/{tool}` | `/compare/spreadsheets` | Competitor alternatives |
| `city-hub` 📋 | `/cities/{city}` | `/cities/sydney` | **[PLANNED]** City landing pages |
| `service-hub` 📋 | `/services/{service}` | `/services/mvp-development` | **[PLANNED]** Service landing pages |

### 2.3 Page Status Lifecycle

```
draft → published
```

| Status | Description |
|--------|-------------|
| `draft` ✅ | AI-generated, not validated |
| `published` ✅ | Live on site |
| `pending_review` 📋 | **[PLANNED]** Passed quality gate, awaiting approval |
| `approved` 📋 | **[PLANNED]** Human-approved, ready for scheduling |
| `scheduled` 📋 | **[PLANNED]** Has future `publish_at` date |
| `archived` 📋 | **[PLANNED]** Removed from site, kept for reference |
| `rejected` 📋 | **[PLANNED]** Failed review, needs regeneration |

---

## 3. Quality Gate System ✅

### 3.1 Validation Levels ✅

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

## 4. City & Entity Data ✅

### 4.1 City Schema

**Note:** Cities are defined in `lib/seo/cities.ts` (not in database table).

```typescript
interface City {
  slug: string;                  // URL-safe identifier (e.g., "sydney")
  name: string;                  // Display name (e.g., "Sydney")
  tier: 1 | 2;                   // Only tier 1 or 2 supported
}
```

**Current cities:** 15 total (5 tier-1, 10 tier-2)

### 4.2 Tier Definitions

| Tier | Criteria | Publishing Priority | Count |
|------|----------|---------------------|-------|
| **1** | Major metros (Sydney, Melbourne, Brisbane, Perth, Adelaide) | First | 5 cities |
| **2** | Secondary cities | Second | 10 cities |

**Note:** Tier 3 is NOT supported. Constraint: `city_tier IN (1, 2)` or `NULL`.

### 4.3 Service/Entity Data ✅

**Note:** Services, industries, solutions, and comparisons are defined in TypeScript files (not in database tables).

```typescript
// Simplified schema - defined in TS files, not DB
interface Service {
  slug: string;                  // URL-safe identifier
  name: string;                  // Display name
}

interface Industry {
  slug: string;
  name: string;
}

interface Solution {
  slug: string;
  name: string;
}

interface Comparison {
  slug: string;
  name: string;
}
```

**Current counts:**
- Services: 6
- Industries: 12
- Solutions: TBD
- Comparisons: TBD

### 4.4 Key Files ✅

```
/lib/seo/
  ├── cities.ts                  # City definitions (15 cities)
  ├── services.ts                # Service definitions (6 services)
  ├── industries.ts              # Industry definitions (12 industries)
  ├── solutions.ts               # Solution definitions
  └── comparisons.ts             # Comparison definitions
```

---

## 5. Publishing Pipeline ✅

### 5.1 Publishing Flow ✅

**Current Implementation (Simplified):**

```
┌─────────────┐
│   Draft     │
└─────────────┘
       │
       │ Drip cron job (5 pages/day)
       │ Ordered by city_tier ASC
       ▼
┌─────────────┐
│  Published  │
└─────────────┘
       │
       ▼
┌─────────────────────┐
│ Post-Publish Tasks  │
│ • Revalidate cache  │
└─────────────────────┘
```

**Planned Enhancements:**

```
📋 Quality Gate → Approval → Scheduling workflow
📋 Sitemap updates
📋 Indexing API requests
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

// Default config (✅ Implemented)
const defaultDripConfig: DripConfig = {
  enabled: true,
  pagesPerRun: 5,
  schedule: '0 2 * * *',         // 2 AM UTC daily
  priorityOrder: [
    { routePattern: 'services-city', tierOrder: 'asc' },      // Tier 1 cities first
    { routePattern: 'industries', tierOrder: 'asc' },
    { routePattern: 'industries-city', tierOrder: 'asc' },
    { routePattern: 'solutions', tierOrder: 'asc' },
    { routePattern: 'comparisons', tierOrder: 'asc' },
    // 📋 PLANNED: service-hub, city-hub
  ],
  requireQualityGate: false,      // Currently disabled
  minQualityScore: 80,
};
```

### 5.3 Publishing Algorithm ✅

```typescript
async function getNextPagesToPublish(limit: number): Promise<SeoPage[]> {
  // ✅ Implemented in api/cron/seo-drip
  // Publishes 'draft' pages (no approval workflow yet)
  // Orders by city_tier ASC (tier 1 first) then created_at ASC

  const batch = await db
    .from('seo_pages')
    .select('*')
    .eq('status', 'draft')
    .order('city_tier', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  return batch;
}
```

### 5.4 Post-Publish Tasks ✅

```typescript
async function onPagePublished(page: SeoPage): Promise<void> {
  // ✅ Implemented: Cache revalidation
  await revalidatePath(`/${page.slug}`);

  // 📋 Planned:
  // - Sitemap revalidation
  // - Internal link updates
  // - Google indexing API
  // - Ranking check scheduling
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

## 6. Page Rendering ✅

### 6.1 Layout Components ✅

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

| Variant | Section Order | Status |
|---------|---------------|--------|
| `standard` | Hero → Problem → Solution → Benefits → FAQ → CTA | ✅ Implemented |
| `problem-first` | Problem → Hero → Solution → Benefits → FAQ → CTA | ✅ Implemented |
| `benefits-grid` | Hero → Benefits (3-col grid) → Problem → Solution → FAQ → CTA | ✅ Implemented |
| `faq-heavy` | Hero → Problem → Solution → FAQ (expanded) → Benefits → CTA | ✅ Implemented |
| `story-flow` | Hero → CityContext → Problem → Solution → Benefits → FAQ → CTA | ✅ Implemented |
| `testimonial-heavy` | Hero → Testimonials → Problem → Solution → Benefits → FAQ → CTA | 📋 Planned |

### 6.3 Dynamic Route Structure ✅

```
/app/
  ├── services/[service]/[city]/
  │   └── page.tsx               # ✅ services-city pages
  ├── industries/[industry]/
  │   ├── page.tsx               # ✅ industries national pages
  │   └── [city]/
  │       └── page.tsx           # ✅ industries-city pages
  ├── solutions/[problem]/
  │   └── page.tsx               # ✅ solutions pages
  └── compare/[tool]/
      └── page.tsx               # ✅ comparisons pages

📋 PLANNED:
  ├── services/[service]/
  │   └── page.tsx               # service-hub pages
  └── cities/[city]/
      └── page.tsx               # city-hub pages
```

### 6.4 Page Template ✅

```typescript
// app/services/[service]/[city]/page.tsx
import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/seo/queries';

interface Props {
  params: { service: string; city: string };
}

export async function generateMetadata({ params }: Props) {
  const slug = `services/${params.service}/${params.city}`;
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

export default async function ServiceCityPage({ params }: Props) {
  const slug = `services/${params.service}/${params.city}`;
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

## 7. Technical SEO 🚧

### 7.1 Structured Data (JSON-LD) 📋

**[PLANNED]** Not yet implemented. Future implementation will include:

```typescript
// 📋 PLANNED
interface PageJsonLd {
  service?: ServiceSchema;
  faq?: FAQPageSchema;
  breadcrumb?: BreadcrumbListSchema;
  organization?: OrganizationSchema;
}
```

### 7.2 Canonical URL Management 📋

**[PLANNED]** Not yet implemented.

### 7.3 Dynamic Sitemap 📋

**[PLANNED]** Not yet implemented.

### 7.4 OG Image Generation 📋

**[PLANNED]** Not yet implemented.

### 7.5 Robots.txt 📋

**[PLANNED]** Not yet implemented.

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

## 8. SERP Tracking ✅

### 8.1 Tracking Configuration ✅

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

### 8.4 Stats Aggregation 📋

**[PLANNED]** Currently computed via queries in dashboard. Database trigger not yet implemented.

**Note:** `ranking_history` table uses `date DATE` (not `checked_at TIMESTAMPTZ`). This means one ranking check per day per keyword.

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

## 9. Dashboard & Analytics 🚧

### 9.1 KPI Cards ✅

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

#### Position Trend Chart (Line) 📋
**[PLANNED]** Not yet implemented.

#### Position Distribution Chart (Bar) 📋
**[PLANNED]** Not yet implemented.

#### Publishing Progress Chart (Area) 📋
**[PLANNED]** Not yet implemented.

#### Route Pattern Breakdown (Table) ✅
**[IMPLEMENTED]** Shows breakdown by route pattern with draft/published counts.

### 9.3 Rankings Table ✅

**[IMPLEMENTED]** Basic rankings table with:

| Column | Description | Status |
|--------|-------------|--------|
| Keyword | Tracked keyword | ✅ Implemented |
| Route Pattern | Page route pattern | ✅ Implemented |
| Current Position | Latest ranking | ✅ Implemented |
| Last Checked | Date of last check | ✅ Implemented |

#### Table Filters 🚧
- **Route pattern**: ✅ Implemented (services-city, industries, etc.)
- **Position buckets**: 📋 Planned
- **City tier**: 📋 Planned
- **Status trends**: 📋 Planned

### 9.4 Top Movers Panel 📋

**[PLANNED]** Not yet implemented.

### 9.5 Content Pipeline Panel ✅

**[IMPLEMENTED]** Basic stats and breakdown.

| Metric | Status |
|--------|--------|
| Total Pages | ✅ Implemented |
| Published | ✅ Implemented |
| Draft | ✅ Implemented |
| Est. Completion | 📋 Planned |

#### Breakdown Table ✅
| Route Pattern | Tier 1 | Tier 2 | Total | Published |
|---------------|--------|--------|-------|-----------|
| services-city | X | X | X | X |
| industries | - | - | X | X |
| industries-city | X | X | X | X |
| solutions | - | - | X | X |
| comparisons | - | - | X | X |

**Note:** Only tier 1 and 2 are supported (no tier 3).

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

## 10. Keyword Management 🚧

### 10.1 Keyword Sources ✅

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

### 10.3 Bulk Operations 📋

**[PLANNED]** Not yet implemented.

### 10.4 Keyword Suggestions 📋

**[PLANNED]** Not yet implemented.

---

## 11. Internal Linking ✅

### 11.1 Linking Strategy ✅

```typescript
interface InternalLinkConfig {
  maxLinksPerSection: number;    // Default: 3
  linkTypes: {
    sameServiceOtherCities: boolean;       // ✅ Implemented
    sameCityOtherServices: boolean;        // ✅ Implemented
    relatedRoutePatterns: boolean;
    parentHub: boolean;
  };

  // Prioritization
  priorityFactors: {
    sameServiceWeight: number;
    sameTierWeight: number;
    publishedRecentlyWeight: number;
  };
}
```

### 11.2 Link Generation

```typescript
interface InternalLink {
  url: string;
  anchor: string;
  relationship: 'same-service' | 'same-city' | 'related';
}

async function generateInternalLinks(
  page: SeoPage,
  config: InternalLinkConfig
): Promise<InternalLink[]> {
  // ✅ Implemented in lib/seo/internal-links.ts
  // Generates links based on route pattern and city tier

  const links: InternalLink[] = [];

  // Same service, other cities (for services-city pattern)
  if (config.linkTypes.sameServiceOtherCities && page.route_pattern === 'services-city') {
    const related = await db
      .from('seo_pages')
      .select('*')
      .eq('status', 'published')
      .eq('route_pattern', 'services-city')
      .neq('id', page.id)
      .order('city_tier', { ascending: true })
      .limit(config.maxLinksPerSection);

    links.push(...related.map(r => ({
      url: `/${r.slug}`,
      anchor: `${extractService(r.slug)} in ${extractCity(r.slug)}`,
      relationship: 'same-service',
    })));
  }

  return links;
}
```

### 11.3 Link Health Monitoring 📋

**[PLANNED]** Not yet implemented.

```typescript
// 📋 PLANNED
interface LinkHealth {
  pageId: string;
  outboundLinks: number;
  inboundLinks: number;
  brokenLinks: number;
  orphanPage: boolean;           // No inbound links
  lastCheckedAt: string;
}
```

---

## 12. Alert System 📋

**[PLANNED]** Not yet implemented.

### 12.1 Alert Types 📋

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

## 13. Google Search Console Integration 📋

**[PLANNED]** Not yet implemented.

### 13.1 Data to Fetch 📋

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

## 14. Content Lifecycle Management 📋

**[PLANNED]** Not yet implemented.

### 14.1 Content Refresh 📋

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

### 15.1 Actual Implemented Schema ✅

```sql
-- Main SEO Pages (✅ Implemented)
CREATE TABLE seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_pattern TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content JSONB DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  city_tier SMALLINT CHECK (city_tier IS NULL OR city_tier IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracked Sites (✅ Implemented - no seo_ prefix)
CREATE TABLE tracked_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracked Keywords (✅ Implemented - no seo_ prefix)
CREATE TABLE tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES tracked_sites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  route_pattern TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, keyword)
);

-- Ranking History (✅ Implemented - no seo_ prefix, uses DATE not TIMESTAMPTZ)
CREATE TABLE ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES tracked_keywords(id) ON DELETE CASCADE,
  date DATE NOT NULL,           -- NOTE: Uses DATE, not checked_at TIMESTAMPTZ
  position INTEGER,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword_id, date)
);

-- Indexes (✅ Implemented)
CREATE INDEX idx_seo_pages_status ON seo_pages(status);
CREATE INDEX idx_seo_pages_route_pattern ON seo_pages(route_pattern);
CREATE INDEX idx_seo_pages_city_tier ON seo_pages(city_tier);
```

### 15.2 Planned Tables 📋

The following tables are **NOT implemented** but may be added in the future:

```sql
-- 📋 PLANNED: Entity definition tables
-- seo_locations (data lives in lib/seo/cities.ts)
-- seo_services (data lives in lib/seo/services.ts)
-- seo_industries (data lives in lib/seo/industries.ts)
-- seo_solutions (data lives in lib/seo/solutions.ts)
-- seo_comparisons (data lives in lib/seo/comparisons.ts)

-- 📋 PLANNED: Content versioning
-- seo_page_versions

-- 📋 PLANNED: Page statistics
-- seo_page_stats

-- 📋 PLANNED: Google Search Console integration
-- seo_gsc_data

-- 📋 PLANNED: Alert system
-- seo_alerts

-- 📋 PLANNED: Internal linking
-- seo_internal_links
-- seo_link_health

-- 📋 PLANNED: Configuration storage
-- seo_config
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

### 16.1 Implemented Endpoints ✅

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/admin/seo-pages/stats` | GET | Get pipeline statistics | ✅ Implemented |
| `/api/admin/rankings/route` | GET | Get rankings by route pattern | ✅ Implemented |
| `/api/admin/rankings/keywords` | GET | Get keywords list | ✅ Implemented |
| `/api/admin/rankings/summary` | GET | Get ranking summary stats | ✅ Implemented |
| `/api/cron/serp-check` | POST | SERP ranking check | ✅ Implemented |
| `/api/cron/seo-drip` | POST | Drip publish pages | ✅ Implemented |

### 16.2 Planned Endpoints 📋

**Public API:**
| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/seo/page/[slug]` | GET | Get published page by slug | 📋 Planned |
| `/api/sitemap.xml` | GET | Dynamic sitemap | 📋 Planned |
| `/api/og` | GET | OG image generation | 📋 Planned |

**Admin CRUD API:**
| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/admin/pages` | GET | List all pages (with filters) | 📋 Planned |
| `/api/admin/pages` | POST | Create page manually | 📋 Planned |
| `/api/admin/pages/[id]` | GET | Get page by ID | 📋 Planned |
| `/api/admin/pages/[id]` | PATCH | Update page | 📋 Planned |
| `/api/admin/pages/[id]` | DELETE | Delete page | 📋 Planned |
| `/api/admin/pages/[id]/publish` | POST | Publish single page | 📋 Planned |
| `/api/admin/pages/[id]/approve` | POST | Approve page | 📋 Planned |
| `/api/admin/pages/[id]/reject` | POST | Reject page | 📋 Planned |
| `/api/admin/pages/[id]/regenerate` | POST | Regenerate content | 📋 Planned |
| `/api/admin/pages/bulk` | POST | Bulk operations | 📋 Planned |
| `/api/admin/keywords` | GET | List tracked keywords | 📋 Planned |
| `/api/admin/keywords` | POST | Add keywords | 📋 Planned |
| `/api/admin/keywords` | DELETE | Delete keywords | 📋 Planned |
| `/api/admin/keywords/[id]/check` | POST | Force ranking check | 📋 Planned |
| `/api/admin/alerts` | GET | List alerts | 📋 Planned |
| `/api/admin/alerts/[id]/acknowledge` | POST | Acknowledge alert | 📋 Planned |
| `/api/admin/alerts/[id]/resolve` | POST | Resolve alert | 📋 Planned |
| `/api/admin/config` | GET | Get configuration | 📋 Planned |
| `/api/admin/config` | PATCH | Update configuration | 📋 Planned |

**Cron Jobs:**
| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/cron/gsc-sync` | POST | GSC data sync | 📋 Planned |
| `/api/cron/link-health` | POST | Link health check | 📋 Planned |
| `/api/cron/generate` | POST | Generate content | 📋 Planned |

---

## 17. Cron Jobs

### 17.1 Schedule

| Job | Schedule | Purpose | Status |
|-----|----------|---------|--------|
| `seo-drip` | `0 2 * * *` (2 AM UTC) | Publish pages with tier ordering | ✅ Implemented |
| `serp-check` | `0 5 * * *` (5 AM UTC) | Check keyword rankings | ✅ Implemented |
| `gsc-sync` | `0 6 * * *` (6 AM UTC) | Sync GSC data | 📋 Planned |
| `link-health` | `0 7 * * 0` (7 AM UTC Sunday) | Check internal links | 📋 Planned |
| `content-refresh` | `0 3 * * 0` (3 AM UTC Sunday) | Identify stale content | 📋 Planned |

### 17.2 Vercel Configuration

**Implemented:**
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
    }
  ]
}
```

**Planned:**
```json
{
  "crons": [
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

## 20. Export & Reporting 📋

**[PLANNED]** Not yet implemented.

### 20.1 Export Formats 📋

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

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] ✅ Database schema migration (`seo_pages`, rank tracker tables)
- [x] ✅ City/service data in TypeScript files (15 cities, 6 services, 12 industries)
- [x] ✅ Content generation pipeline (`lib/seo/generation.ts`)
- [x] ✅ Quality gate system (`lib/seo/quality-gate.ts`)
- [x] ✅ Basic page rendering (5 route patterns)

### Phase 2: Publishing Pipeline ✅ COMPLETE
- [x] ✅ Drip publishing system (`api/cron/seo-drip`)
- [x] ✅ Priority ordering logic with city tier support
- [x] ✅ Post-publish tasks (cache revalidation)
- [ ] 📋 Sitemap generation (planned)

### Phase 3: Layout Variants 🚧 PARTIAL
- [x] ✅ Standard layout
- [x] ✅ Problem-first layout
- [x] ✅ Benefits-grid layout
- [x] ✅ FAQ-heavy layout
- [x] ✅ Story-flow layout
- [ ] 📋 Testimonial-heavy layout (not implemented)

### Phase 4: SERP Tracking ✅ COMPLETE
- [x] ✅ SERP provider integration (`api/cron/serp-check`)
- [x] ✅ Ranking snapshots storage (`ranking_history` table)
- [ ] 📋 Stats aggregation trigger (manual queries for now)
- [x] ✅ Keyword management (basic tracking)

### Phase 5: Dashboard ✅ COMPLETE
- [x] ✅ KPI cards with stats
- [x] ✅ Rankings table
- [x] ✅ Route pattern breakdown
- [ ] 📋 Position trend chart (planned)
- [ ] 📋 Distribution chart (planned)
- [ ] 📋 Top movers panel (planned)

### Phase 6: Advanced Features 🚧 PARTIAL
- [x] ✅ Internal linking system (`lib/seo/internal-links.ts`)
- [ ] 📋 Alert system (not implemented)
- [ ] 📋 GSC integration (not implemented)
- [ ] 📋 Content versioning (not implemented)
- [ ] 📋 Scheduled publishing (not implemented)
- [ ] 📋 Export/reporting (not implemented)

### Phase 7: Optimization 📋 NOT STARTED
- [ ] 📋 Link health monitoring
- [ ] 📋 Content refresh system
- [ ] 📋 A/B testing framework
- [ ] 📋 Performance monitoring

**Legend:**
- ✅ = Fully implemented
- 🚧 = Partially implemented
- 📋 = Planned but not started

---