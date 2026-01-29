# Ensemble Execution Plan
**Status**: Completed
**Complexity**: 45/100
**Agents**: 3 (SIMPLICITY, ROBUSTNESS, MAINTAINABILITY)

## Questions & Clarifications
None - requirements clear from detailed spec.

## Objective
Implement a programmatic SEO system with database migration, static data files, content generation script, page templates for 5 route patterns, and sitemap integration.

## Agent Type: backend-developer

## Base Task
Build pSEO system for Jarve agency Next.js site with Supabase backend.

## Tasks
- [x] Phase 0: Research codebase patterns (Supabase client, layouts, routing)
- [ ] Phase 1: Database migration (seo_pages table)
- [ ] Phase 2: Static data files (lib/seo/*)
- [ ] Phase 3: Content generator script
- [ ] Phase 4: Page templates (5 route patterns)
- [ ] Phase 5: Sitemap
- [ ] Phase 6: Package.json updates

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
- Use `createAnonClient()` from `utils/supabase/anon.ts` for public page data fetching (no cookies needed)
- Use `createAdminClient()` from `utils/supabase/admin.ts` for the generation script
- No existing sitemap.ts - creating new one
- Existing robots.ts allows `/` but disallows `/admin/`, `/api/`, `/app/`
