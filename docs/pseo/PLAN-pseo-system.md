# Ensemble Execution Plan
**Status**: Executing
**Complexity**: 45/100 → 3 agents
**Agents**: 3 (SIMPLICITY, ROBUSTNESS, MAINTAINABILITY)
**Updated**: 2026-01-30

## Questions & Clarifications
- Jarve = James, solo operator, Adelaide-based, works Australia-wide
- Uses first person ("I" not "we"), never claims to be in another city
- Voice: ex-tradesman who builds software, practical not corporate

## Objective
Implement a programmatic SEO system with database migration, static data files, content generation script, page templates for 5 route patterns, and sitemap integration.

## Agent Type: backend-developer

## Base Task
Build pSEO system for Jarve agency Next.js site with Supabase backend.

## Tasks
- [x] Phase 0: Research codebase patterns (Supabase client, layouts, routing)
- [x] Phase 1: Database migration (seo_pages table) — applied to Supabase
- [x] Phase 2: Static data files (lib/seo/*) — enriched with localDetails, pricing
- [x] Phase 3: Content generator script — uses PROMPT-pseo-content.md voice
- [x] Phase 4: Page templates (5 route patterns) — rendering new content structure
- [x] Phase 5: Sitemap — includes published pages
- [x] Phase 6: Package.json updates — @anthropic-ai/sdk, tsx, dotenv
- [x] Phase 7: Copy quality review — marketing critique, prompt rewritten
- [x] Phase 8: Content structure v2 — heroHeadline, cityContext, localSignals
- [x] Phase 9: TypeScript + lint + build passing
- [x] Phase 10: Committed and pushed
- [x] Phase 11: Quality gate (`lib/seo/quality-gate.ts`) — blocks false claims, pronouns, buzzwords
- [x] Phase 12: Shared generation module (`lib/seo/generation.ts`) — fixVoice, pickLayout, generateContent
- [x] Phase 13: Internal links (`lib/seo/internal-links.ts`) — organic cross-linking
- [x] Phase 14: OG image generation (`app/api/og/route.tsx`) — Edge, 1200x630
- [x] Phase 15: Daily cron drip (`app/api/cron/seo-drip/route.ts`) — ~5 pages/day
- [x] Phase 16: All 5 SEO routes updated with OG images + internal links
- [x] Phase 17: vercel.json cron entry, @vercel/og dependency, metaDescription type
- [ ] Phase 18: James reviews test pages (mvp-development sydney + melbourne)
- [ ] Phase 19: Generate all 187 pages
- [ ] Phase 20: Set CRON_SECRET env var in Vercel
- [ ] Phase 21: Deploy to Vercel, verify SSG + cron execution
- [ ] Phase 22: Monitor SEO impact, cron publishes remaining batches automatically

## Files to Modify
- `supabase/migrations/20260130000001_create_seo_pages.sql` - new migration
- `lib/seo/types.ts` - TypeScript types (incl. metaDescription)
- `lib/seo/cities.ts` - Australian cities data
- `lib/seo/services.ts` - Services data
- `lib/seo/industries.ts` - Industries data
- `lib/seo/solutions.ts` - Solutions data
- `lib/seo/comparisons.ts` - Comparisons data
- `lib/seo/index.ts` - barrel export
- `lib/seo/quality-gate.ts` - pre-publish content validation
- `lib/seo/generation.ts` - shared: fixVoice, pickLayout, generateContent
- `lib/seo/internal-links.ts` - cross-page linking queries
- `lib/seo/components.tsx` - Breadcrumbs, SeoPageSections, InternalLinksSection
- `scripts/generate-seo-content.ts` - content generation CLI (imports from generation.ts)
- `app/api/og/route.tsx` - OG image generation (Edge runtime)
- `app/api/cron/seo-drip/route.ts` - daily cron publisher
- `app/services/[service]/[city]/page.tsx` - service+city template
- `app/industries/[industry]/page.tsx` - industry template
- `app/industries/[industry]/[city]/page.tsx` - industry+city template
- `app/solutions/[problem]/page.tsx` - solution template
- `app/compare/[tool]/page.tsx` - comparison template
- `app/sitemap.ts` - new sitemap
- `package.json` - add dependencies and script

## Perspective Prompts
1. SIMPLICITY: Keep templates DRY with shared components, minimal abstractions
2. ROBUSTNESS: Handle missing content gracefully, notFound() for missing pages
3. MAINTAINABILITY: Clean data structures, typed content, reusable patterns

## Decisions Made
- Use `createAnonClient()` from `utils/supabase/anon.ts` for public page data fetching
- Content structure matches PROMPT-pseo-content.md (heroHeadline, cityContext, localSignals, faq array, metaDescription)
- James's voice: first person, Adelaide-based, ex-tradesman, practical
- Never claims to be in any city other than Adelaide
- Services include concrete pricing ($5-40K ranges) and timelines
- Cities include rich localDetails (accelerators, industries, culture)
- Duplicate migration timestamps fixed (20260124000001 → 000002/3/4)
- dotenv added for script to auto-load .env.local
- Drip pipeline publishes ~5 pages/day via Vercel cron at 2am UTC
- Quality gate validates content before publishing (false claims, pronouns, buzzwords, word counts)
- Internal links grow organically (same-service/diff-city + same-city/diff-service)
- OG images auto-generated via Edge runtime endpoint
- Generation functions extracted to shared module (used by both CLI and cron)
