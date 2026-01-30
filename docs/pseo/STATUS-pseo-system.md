# pSEO System - Status

**Updated**: 2026-01-30
**Branch**: cursor/pseo-local-strategy-d19c

## Current State: Phase 3 Complete — Ready for Batch Generation

### What's Done
- [x] Database: `seo_pages` table live in Supabase (migration applied)
- [x] Static data: cities (15), services (6), industries (12), solutions (15), comparisons (10)
- [x] Cities enriched with `localDetails` (accelerators, industries, culture per city)
- [x] Services enriched with `priceRange`, `timeline`, `keyFeatures`, `typicalClient`
- [x] Content generator script with proper prompt (James voice, Adelaide-based, first person)
- [x] Content structure: heroHeadline, heroSubheadline, cityContext, problemStatement, solution, benefits, localSignals, ctaText, faq (array), layout, testimonialMatch
- [x] **FAQ expanded: 3-5 FAQs per page** (was single FAQ)
- [x] **5 layout variants**: standard, problem-first, faq-heavy, benefits-grid, story-flow — randomly assigned at generation
- [x] **Post-processing**: auto-replaces "we/We" → "I" in all generated content
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

### What's NOT Done
- [ ] **Publish test pages** and review on localhost (run `npm run generate-seo publish "mvp-development-%"`)
- [ ] **Copy review by James** — check localhost:3000/services/mvp-development/sydney and /melbourne
- [ ] Generate remaining 185 pages (`npm run generate-seo generate`)
- [ ] Publish in batches (tier-1 service+city first = 30 pages)
- [ ] Internal linking between related pages
- [ ] Add testimonial/social proof sections (testimonialMatch field exists but no UI yet)
- [ ] robots.ts may need updating for new routes
- [ ] Deploy to Vercel and verify static generation

## Key Files
| File | Purpose |
|------|---------|
| `lib/seo/types.ts` | TypeScript interfaces (faq is array, layout field) |
| `lib/seo/cities.ts` | 15 cities with localDetails |
| `lib/seo/services.ts` | 6 services with pricing/timeline |
| `lib/seo/industries.ts` | 12 industries |
| `lib/seo/solutions.ts` | 15 solutions |
| `lib/seo/comparisons.ts` | 10 comparisons |
| `lib/seo/queries.ts` | Supabase query helpers + buildFaqJsonLd() |
| `lib/seo/components.tsx` | Breadcrumbs + SeoPageSections (5 layout variants, FadeIn, green CTAs) |
| `scripts/generate-seo-content.ts` | Content generator (Anthropic SDK, we→I post-process, random layout) |
| `app/services/[service]/[city]/page.tsx` | 90 service+city pages |
| `app/industries/[industry]/page.tsx` | 12 industry pages |
| `app/industries/[industry]/[city]/page.tsx` | 60 industry+city pages |
| `app/solutions/[problem]/page.tsx` | 15 solution pages |
| `app/compare/[tool]/page.tsx` | 10 comparison pages |
| `app/sitemap.ts` | Dynamic sitemap |
| `supabase/migrations/20260130000001_create_seo_pages.sql` | DB migration |

## Important Context
- **Jarve = James, solo operator, Adelaide-based, works Australia-wide**
- Content uses first person ("I" not "we") — enforced by post-processing
- Never claims to be based in any city other than Adelaide
- Voice: ex-tradesman who builds software, practical not corporate
- Prices in AUD, ABN registered, ACST timezone
- `faq` is an **array** of 3-5 items (legacy single-object normalized at read time)
- `layout` field picks from 5 variants, assigned randomly at generation
- Components use FadeIn animations, green gradient CTAs, radial backgrounds (matches main site)

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
```

## Blockers
- Copy quality depends on prompt — if output is generic, tweak prompt in generate-seo-content.ts
- Rotate ANTHROPIC_API_KEY (was exposed in chat history)
