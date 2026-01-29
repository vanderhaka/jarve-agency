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
- [ ] Phase 11: James reviews test pages (mvp-development sydney + melbourne)
- [ ] Phase 12: Generate all 187 pages
- [ ] Phase 13: Publish tier-1 service+city batch (30 pages)
- [ ] Phase 14: Deploy to Vercel, verify SSG
- [ ] Phase 15: Monitor SEO impact, publish remaining batches

## Files to Modify
- `supabase/migrations/20260130000001_create_seo_pages.sql` - new migration
- `lib/seo/types.ts` - TypeScript types
- `lib/seo/cities.ts` - Australian cities data
- `lib/seo/services.ts` - Services data
- `lib/seo/industries.ts` - Industries data
- `lib/seo/solutions.ts` - Solutions data
- `lib/seo/comparisons.ts` - Comparisons data
- `lib/seo/index.ts` - barrel export
- `scripts/generate-seo-content.ts` - content generation CLI
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
- Content structure matches PROMPT-pseo-content.md (heroHeadline, cityContext, localSignals, single FAQ)
- James's voice: first person, Adelaide-based, ex-tradesman, practical
- Never claims to be in any city other than Adelaide
- Services include concrete pricing ($5-40K ranges) and timelines
- Cities include rich localDetails (accelerators, industries, culture)
- Duplicate migration timestamps fixed (20260124000001 → 000002/3/4)
- dotenv added for script to auto-load .env.local
