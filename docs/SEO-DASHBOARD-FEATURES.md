# SEO Dashboard - Complete Feature Reference

> Comprehensive documentation of every feature in the pSEO dashboard for replication in other projects.

---

## 1. AI Content Generation Pipeline

**What**: Generates 307 landing pages across 5 route patterns (services×cities, industries, industries×cities, solutions, comparisons) using Claude Sonnet 4.

**Why**: Programmatic SEO at scale — manually writing 307 pages is impractical. AI generates structured content (hero, problem, solution, benefits, FAQ, CTA) that's consistent in voice and quality.

**How**: CLI script (`scripts/generate-seo-content.ts`) builds prompts from static data files (cities, services, industries, solutions, comparisons) → sends to Anthropic API → parses JSON response → post-processes voice (we→I) → assigns random layout variant (5 types) → stores as draft in `seo_pages` table.

**Key files**:
- `scripts/generate-seo-content.ts` - CLI script for bulk generation
- `lib/seo/generation.ts` - Claude API integration
- `lib/seo/types.ts` - TypeScript interfaces
- `lib/seo/cities.ts` - 15 Australian cities
- `lib/seo/services.ts` - 6 service types
- `lib/seo/industries.ts` - 12 industry verticals
- `lib/seo/solutions.ts` - 15 solution categories
- `lib/seo/comparisons.ts` - 10 tool comparisons

**Content structure** (SeoContent type):
- `heroHeadline` - Main H1 (max 8 words)
- `heroSubheadline` - Supporting text (max 20 words)
- `cityContext` - Local relevance paragraph (max 50 words, optional)
- `problemStatement` - Customer pain points (max 60 words)
- `solution` - How it's solved (max 60 words)
- `benefits` - Array of 3 benefit cards (title + description)
- `localSignals` - Array of 3 trust signals
- `ctaText` - Call to action button text (max 6 words)
- `faq` - Array of 3-5 FAQ items (question + answer)
- `layout` - Layout variant identifier
- `testimonialMatch` - Ideal testimonial description (future use)
- `metaDescription` - SEO meta description (max 155 chars)

**Page counts**:
| Route Pattern | Formula | Count |
|---------------|---------|-------|
| Services × Cities | 6 × 15 | 90 |
| Industries (national) | 12 | 12 |
| Industries × Cities | 12 × 15 | 180 |
| Solutions | 15 | 15 |
| Comparisons | 10 | 10 |
| **Total** | | **307** |

---

## 2. Quality Gate

**What**: Validates content before publishing — blocks false claims, wrong pronouns, buzzwords, missing fields, word limit violations.

**Why**: Prevents low-quality or off-brand pages from going live. Catches AI hallucinations like fabricated experience claims.

**How**: `lib/seo/quality-gate.ts` runs regex checks against all string fields. Returns `{ passed, errors[], warnings[] }`. Called by drip cron before each publish.

**Blocking rules**:
1. False claims - Detects "I've built" or location-specific fabrications
2. Pronoun check - Blocks "we/our" (excludes customer-voiced FAQ questions)
3. Buzzwords - Blocks corporate jargon (synergy, cutting-edge, innovative, leverage, etc.)
4. Required fields - Ensures all mandatory fields present
5. Word counts - Enforces max limits per field

**Warning rules** (logged, non-blocking):
1. Generic CTAs (e.g., "Get Started", "Contact Us")
2. Low FAQ count (<3)
3. Missing or long meta description (>160 chars)

---

## 3. Drip Publishing System

**What**: Auto-publishes 5 draft pages/day at 2am UTC via Vercel cron.

**Why**: Gradual publishing looks more natural to Google than dumping 300+ pages at once. Allows catching quality issues early.

**How**: Cron job (`api/cron/seo-drip`) queries next 5 unpublished pages using wave-priority ordering. Runs quality gate, updates status to published, revalidates Next.js cache + sitemap.

**Wave-priority ordering**:
1. `services-city` (tier 1 first, then tier 2)
2. `industries`
3. `comparisons`
4. `solutions`
5. `industries-city` (tier 1 first, then tier 2)

**Key files**:
- `app/api/cron/seo-drip/route.ts` - Cron handler
- `vercel.json` - Cron schedule config

**Config**: Batch size 5/day, authenticated via `CRON_SECRET` header.

---

## 4. City Tier System

**What**: Groups cities into tier 1 (major metros) and tier 2 (smaller cities).

**Why**: Prioritizes higher-traffic cities first for faster SEO impact. Tier 1 pages publish before tier 2.

**How**: `city_tier` column (SMALLINT, 1 or 2) on `seo_pages` table. Drip query orders by tier within each route pattern.

**Tier 1** (5 cities): Sydney, Melbourne, Brisbane, Perth, Adelaide
**Tier 2** (10 cities): Gold Coast, Canberra, Newcastle, Wollongong, Hobart, Geelong, Sunshine Coast, Townsville, Cairns, Darwin

---

## 5. Dynamic Page Rendering (5 Layout Variants)

**What**: Server-side rendered pages via Next.js App Router with 5 layout variants: standard, problem-first, faq-heavy, benefits-grid, story-flow.

**Why**: Layout diversity prevents Google from flagging pages as thin/duplicate content. Static generation gives fast load times.

**How**: `generateStaticParams()` fetches all published slugs. Page templates render content using `SeoPageSections` component based on layout field.

**Key files**:
- `app/services/[service]/[city]/page.tsx` - Services × City
- `app/industries/[industry]/page.tsx` - Industries
- `app/industries/[industry]/[city]/page.tsx` - Industries × City
- `app/solutions/[problem]/page.tsx` - Solutions
- `app/compare/[tool]/page.tsx` - Comparisons
- `lib/seo/components.tsx` - Shared UI components
- `lib/seo/queries.ts` - Supabase query helpers

---

## 6. Schema.org JSON-LD

**What**: Embeds Service + FAQPage structured data on every page.

**Why**: Enables rich snippets in Google search results (FAQ dropdowns, service info). Improves CTR.

**How**: `buildFaqJsonLd()` generates JSON-LD from page FAQ data. Injected as `<script type="application/ld+json">` in page head.

---

## 7. Internal Cross-Linking

**What**: Auto-links related published pages (same service/different city, same city/different service, etc.).

**Why**: Distributes PageRank across pages, improves crawlability, reduces bounce rate. Links grow organically as more pages publish.

**How**: `lib/seo/internal-links.ts` queries `seo_pages` for related published pages based on route pattern. Max 3 links per group. Rendered in `InternalLinksSection` at page bottom.

**Linking strategies by route pattern**:
- `services-city`: same service/other cities + same city/other services
- `industries`: other industry national pages
- `industries-city`: same industry/other cities + same city/other industries
- `solutions`: other solution pages
- `comparisons`: other comparison pages

---

## 8. Dynamic Sitemap

**What**: Auto-generated XML sitemap at `/sitemap.xml` including all published SEO pages.

**Why**: Tells Google about all pages and when they were last updated. Essential for indexing 300+ pages.

**How**: `app/sitemap.ts` queries all published pages, converts slugs to URLs using `slugToPath()`. Revalidated after each drip publish. SEO pages get priority 0.7, monthly change frequency.

---

## 9. OG Image Generation

**What**: Auto-generated social share images per page via `/api/og`.

**Why**: Better social sharing appearance on LinkedIn, Twitter, etc.

**How**: Uses `@vercel/og` (Edge runtime) to generate images dynamically from page title/description.

---

## 10. SERP Rank Tracker

**What**: Daily Google position checks for tracked keywords via SerpAPI (top 100 results, Australia).

**Why**: Measures whether the pSEO strategy is working. Tracks which pages rank and for what keywords.

**How**: Cron at 4am UTC (`api/cron/serp-check`) → fetches active keywords from `tracked_keywords` table → calls SerpAPI per keyword (engine=google, gl=au, num=100) → searches results for domain → upserts position into `ranking_history` table.

**Key files**:
- `lib/seo/serp-tracker.ts` - SerpAPI client and check logic
- `app/api/cron/serp-check/route.ts` - Cron handler

**SerpAPI params**: engine=google, gl=au, hl=en, num=100

---

## 11. SERP Dashboard Visualizations

**What**: Line charts showing position trends over time, summary cards, top movers/biggest drops.

**Why**: At-a-glance understanding of SEO performance without manually checking Google.

**How**: APIs query `ranking_history`, frontend uses Recharts with inverted Y-axis (lower=better). Movers calculated by comparing latest position vs 7 days ago.

**Dashboard components**:
1. **Summary Cards**: Avg Position, Top 10 count, Top 30 count, Tracked vs Ranking
2. **Position Over Time Chart**: Line chart, filterable by site and time range (7/30/90 days)
3. **Top Movers / Biggest Drops**: Keywords with largest 7-day position changes
4. **All Keywords Table**: Current position, best ever, 7-day change, ranking URL

**Key files**:
- `app/admin/seo-dashboard/page.tsx` - Main dashboard
- `app/api/admin/rankings/route.ts` - Historical data API
- `app/api/admin/rankings/summary/route.ts` - Summary stats API

---

## 12. Keyword Management

**What**: Bulk add/delete tracked keywords via admin UI. Per-site tracking.

**Why**: Easily expand keyword monitoring as new pages publish and new opportunities emerge.

**How**: `api/admin/rankings/keywords/route.ts` handles CRUD. POST accepts array of keywords, normalizes (trim, lowercase), upserts to avoid duplicates. DELETE cascades to ranking_history.

**Endpoints**:
- `GET /api/admin/rankings/keywords` - List all keywords
- `POST /api/admin/rankings/keywords` - Bulk add `{ site_id, keywords[] }`
- `DELETE /api/admin/rankings/keywords` - Delete `{ id }`

---

## 13. Content Pipeline Dashboard

**What**: Shows published/total count, drip rate, estimated completion date, breakdown by route pattern and city tier, recently published pages.

**Why**: Track progress of the full page rollout and know when it'll complete.

**How**: `api/admin/seo-pages/stats/route.ts` queries `seo_pages` for status counts, groups by route_pattern and city_tier. Cross-references with ranking_history to show how many published pages are ranking.

**Metrics displayed**:
- Published / Total (with progress bar)
- Drip Rate (pages/day)
- Estimated Completion Date
- Pages Ranking (published pages appearing in SERP)
- Breakdown table by route pattern and city tier
- Last 10 published pages with links

---

## Database Schema

### `seo_pages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| route_pattern | TEXT | services-city, industries, industries-city, solutions, comparisons |
| slug | TEXT | Unique, URL-safe |
| status | TEXT | draft or published |
| content | JSONB | Full SeoContent structure |
| meta_title | TEXT | Nullable |
| meta_description | TEXT | Nullable |
| city_tier | SMALLINT | 1 or 2, nullable |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### `tracked_sites`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| domain | TEXT | Unique (e.g., jarve.com.au) |
| name | TEXT | Human-readable |
| active | BOOLEAN | Enable/disable |
| created_at | TIMESTAMPTZ | Auto |

### `tracked_keywords`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| site_id | UUID | FK to tracked_sites |
| keyword | TEXT | Search query |
| active | BOOLEAN | Enable/disable |
| created_at | TIMESTAMPTZ | Auto |

### `ranking_history`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| keyword_id | UUID | FK to tracked_keywords |
| position | INTEGER | Nullable (null = not in top 100) |
| url | TEXT | Which URL ranked |
| date | DATE | Snapshot date |
| serp_data | JSONB | Raw SerpAPI snippet |
| created_at | TIMESTAMPTZ | Auto |

**RLS**: Anon users can only SELECT published `seo_pages`. Authenticated users get full CRUD.

---

## External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Anthropic Claude API | Content generation | ~$1 total for 307 pages |
| SerpAPI | Daily rank checks | $75/month (900/5000 searches used) |
| Vercel Cron | Scheduled drip + rank checks | Free with Pro |
| Supabase | Database + auth + RLS | Project plan |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API for content generation |
| `SERPAPI_KEY` | SerpAPI for rank checking |
| `CRON_SECRET` | Auth for Vercel cron requests |
| `NEXT_PUBLIC_SITE_URL` | Base URL for sitemap/OG images |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for cron jobs |

---

## Vercel Cron Schedule

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/seo-drip` | Daily 2am UTC | Publish 5 pages |
| `/api/cron/serp-check` | Daily 4am UTC | Check keyword rankings |

---

## CLI Commands

| Command | Purpose |
|---------|---------|
| `npm run generate-seo count` | Show page count breakdown |
| `npm run generate-seo generate [pattern] [limit]` | Generate content |
| `npm run generate-seo publish <slug-pattern>` | Manually publish pages |

---

## Package Dependencies

| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API client |
| `@vercel/og` | OG image generation (Edge) |
| `recharts` | Dashboard charts |
| `lucide-react` | Dashboard icons |
