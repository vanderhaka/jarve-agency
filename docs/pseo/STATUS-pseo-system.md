# pSEO System - Status

**Updated**: 2026-01-30
**Branch**: cursor/pseo-local-strategy-d19c

## Current State: Drip Pipeline Complete — Ready for Automated Publishing

### What's Done
- [x] Database: `seo_pages` table live in Supabase (migration applied)
- [x] Static data: cities (15), services (6), industries (12), solutions (15), comparisons (10)
- [x] Cities enriched with `localDetails` (accelerators, industries, culture per city)
- [x] Services enriched with `priceRange`, `timeline`, `keyFeatures`, `typicalClient`
- [x] Content generator script with proper prompt (James voice, Adelaide-based, first person)
- [x] Content structure: heroHeadline, heroSubheadline, cityContext, problemStatement, solution, benefits, localSignals, ctaText, faq (array), layout, testimonialMatch, metaDescription
- [x] **FAQ expanded: 3-5 FAQs per page** (was single FAQ)
- [x] **5 layout variants**: standard, problem-first, faq-heavy, benefits-grid, story-flow — randomly assigned at generation
- [x] **Post-processing**: auto-replaces "we/We" → "I" using word-boundary regex (`\bwe\b`) to avoid corrupting words like "somewhere"
- [x] **Prompt improvements**: headline quality gate (no keyword stuffing), CTA variation enforced, localSignals diversity enforced
- [x] **FAQPage JSON-LD** structured data on all 5 page templates
- [x] **Styling matched to main site**: FadeIn animations, green gradient CTAs, radial gradient backgrounds, grid patterns, hover card effects, max-w-5xl containers, Check badges on benefits
- [x] Page templates (5 routes) rendering new structure
- [x] JSON-LD Service + FAQPage structured data on all page templates
- [x] Sitemap includes published pages
- [x] TypeScript compiles clean
- [x] 2 test pages generated as draft (mvp-development-sydney, mvp-development-melbourne)
- [x] dotenv added so script reads .env.local automatically
- [x] ANTHROPIC_API_KEY added to .env.local
- [x] **Quality gate** (`lib/seo/quality-gate.ts`): blocks false claims, "we" pronouns, buzzwords, missing fields, word count violations
- [x] **Shared generation module** (`lib/seo/generation.ts`): fixVoice, pickLayout, generateContent extracted from CLI script
- [x] **Internal links** (`lib/seo/internal-links.ts`): organic cross-linking between published pages (same-service/diff-city + same-city/diff-service, etc.)
- [x] **OG image generation** (`app/api/og/route.tsx`): Edge runtime, 1200x630, dark bg, green accent, Jarve branding
- [x] **Daily cron drip** (`app/api/cron/seo-drip/route.ts`): publishes ~5 draft pages/day with quality gate, wave-priority ordering
- [x] **All 5 SEO routes updated**: OG images in metadata + InternalLinksSection component
- [x] **vercel.json**: cron entry `0 2 * * *` for `/api/cron/seo-drip`
- [x] **@vercel/og** dependency added

### What's NOT Done
- [ ] **Publish test pages** and review on localhost (run `npm run generate-seo publish "mvp-development-%"`)
- [ ] **Copy review by James** — check localhost:3000/services/mvp-development/sydney and /melbourne
- [ ] Generate remaining 185 pages (`npm run generate-seo generate`)
- [ ] Set `CRON_SECRET` env var in Vercel for drip cron authentication
- [ ] Add testimonial/social proof sections (`testimonialMatch` field is generated for future use — no UI yet)
- [ ] robots.ts may need updating for new routes
- [ ] Deploy to Vercel and verify static generation + cron execution

## Key Files
| File | Purpose |
|------|---------|
| `lib/seo/types.ts` | TypeScript interfaces (faq is array, layout field, metaDescription) |
| `lib/seo/cities.ts` | 15 cities with localDetails |
| `lib/seo/services.ts` | 6 services with pricing/timeline |
| `lib/seo/industries.ts` | 12 industries |
| `lib/seo/solutions.ts` | 15 solutions |
| `lib/seo/comparisons.ts` | 10 comparisons |
| `lib/seo/queries.ts` | Supabase query helpers + buildFaqJsonLd() |
| `lib/seo/components.tsx` | Breadcrumbs + SeoPageSections (5 layouts) + InternalLinksSection |
| `lib/seo/quality-gate.ts` | Pre-publish content validation (false claims, pronouns, buzzwords) |
| `lib/seo/generation.ts` | Shared: fixVoice, pickLayout, generateContent (Anthropic SDK) |
| `lib/seo/internal-links.ts` | Cross-page linking (same-service/diff-city, etc.) |
| `scripts/generate-seo-content.ts` | CLI content generator (imports from generation.ts) |
| `app/api/og/route.tsx` | OG image generation (Edge, 1200x630, dark/green) |
| `app/api/cron/seo-drip/route.ts` | Daily cron: publish ~5 pages with quality gate |
| `app/services/[service]/[city]/page.tsx` | 90 service+city pages |
| `app/industries/[industry]/page.tsx` | 12 industry pages |
| `app/industries/[industry]/[city]/page.tsx` | 60 industry+city pages |
| `app/solutions/[problem]/page.tsx` | 15 solution pages |
| `app/compare/[tool]/page.tsx` | 10 comparison pages |
| `app/sitemap.ts` | Dynamic sitemap |
| `vercel.json` | Cron schedules (reminders, stripe-reconcile, seo-drip) |
| `supabase/migrations/20260130000001_create_seo_pages.sql` | DB migration |

## Important Context
- **Jarve = James, solo operator, Adelaide-based, works Australia-wide**
- Content uses first person ("I" not "we") — enforced by post-processing
- Never claims to be based in any city other than Adelaide
- Voice: ex-tradesman who builds software, practical not corporate
- Prices in AUD, ABN registered, ACST timezone
- `faq` is an **array** of 3-5 items (legacy single-object normalized at read time)
- `layout` field picks from 5 variants, assigned randomly at generation
- `metaDescription` field added to SeoContent type
- Components use FadeIn animations, green gradient CTAs, radial backgrounds (matches main site)
- **Drip pipeline**: cron runs daily at 2am UTC, publishes 5 draft pages per run
- **Quality gate** blocks: false claims, "we" pronouns (in James's voice only — customer-voiced FAQ questions like "We're growing fast" are allowed), buzzwords, missing fields, word count violations
- **Internal links** grow organically as more pages are published
- **OG images** auto-generated via `/api/og?title=...&description=...`

## Next Session Commands
```bash
# Publish test pages
npm run generate-seo publish "mvp-development-%"

# Check pages
npm run dev
# Visit http://localhost:3000/services/mvp-development/sydney
# Visit http://localhost:3000/services/mvp-development/melbourne

# Generate all pages (~30 min, 187 API calls)
npm run generate-seo generate

# Generate specific pattern
npm run generate-seo generate services-city

# Publish batch
npm run generate-seo publish "mvp-development-%"

# Check count
npm run generate-seo count

# Test cron locally
curl -X POST http://localhost:3000/api/cron/seo-drip -H "Authorization: Bearer $CRON_SECRET"

# Test OG image
# Visit http://localhost:3000/api/og?title=Test+Page&description=Test+description
```

## Blockers
- Copy quality depends on prompt — if output is generic, tweak prompt in generate-seo-content.ts
- ⚠️ **URGENT**: Rotate ANTHROPIC_API_KEY (was exposed in chat history) — do this BEFORE generating content
- Set `CRON_SECRET` env var in Vercel for cron authentication
