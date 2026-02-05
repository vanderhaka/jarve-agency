# Ensemble Execution Plan

**Status**: Planning
**Complexity**: 85/100 (Critical)
**Agents**: 9 (P1-P9: SIMPLICITY, ROBUSTNESS, PERFORMANCE, SECURITY, MAINTAINABILITY, TESTABILITY, SCALABILITY, USABILITY, COMPATIBILITY)
**Started**: 2026-02-06
**Updated**: 2026-02-06

---

## Questions & Clarifications

> None - requirements are clear. All issues identified by 5-agent review (core-logic, security, performance, dashboard-ui, database).

---

## Objective

Fix all critical, high, and medium issues found in the 5-agent pSEO pipeline review: Supabase client mismatches, missing admin auth, race conditions, dashboard bugs, performance bottlenecks, input validation, and data integrity gaps.

## Analysis

The pSEO pipeline has 66 identified issues across 5 review dimensions. The most urgent are 4 Supabase client mismatches that cause silent failures in production cron jobs, missing admin role checks allowing any authenticated user to manage SEO pages, a version numbering race condition, and dashboard loading states that freeze permanently on error. Complexity is high (85/100) due to multi-file changes (+15), security fixes (+18), database migrations (+12), production impact (+15), and refactoring scope (+20).

---

## Agent Type: backend-developer

## Base Task

Fix all issues from the pSEO pipeline review across 4 phases: critical fixes, high-priority bugs, performance optimizations, and data integrity improvements.

---

## Tasks

- [x] Phase 0: Research (5-agent review complete)
- [x] Phase 0.5: Clarify (no blocking questions)
- [x] Phase 1: Plan (this document)
- [ ] Phase 2: Execute (4 phases, 66 items)
- [ ] Phase 3: Review (verify fixes)
- [ ] Phase 4: Validate (types, lint, build)
- [ ] Phase 5: Deliver (commit + summary)

### Implementation Tasks (Micro-Steps)

---

## PHASE 1: Critical Fixes

### Step 1.1: Fix Supabase client mismatches in lib/seo/
- **passes**: true
- **criteria**:
  - test: `grep -r "from '@/utils/supabase/server'" lib/seo/` → "No matches (all switched to admin)"
  - test: `grep "createAnonClient()" lib/seo/queries.ts | head -1` → "No module-scope client"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "All lib/seo files called from cron/admin contexts use createAdminClient"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `lib/seo/versioning.ts:1` - Switch from `createClient` (cookie-based) to `createAdminClient`
  - `lib/seo/alerts.ts:1` - Switch from `createClient` to `createAdminClient`
  - `lib/seo/gsc.ts:7` - Switch from `createClient` to `createAdminClient`
  - `lib/seo/queries.ts:4` - Move `createAnonClient()` from module scope into each function
  - **Why**: Cookie-based client fails silently in cron jobs (no cookies). Versions, alerts, GSC data likely not persisting in production.

### Step 1.2: Add admin role verification to all admin API routes
- **passes**: true
- **criteria**:
  - test: `grep -r "employee.*role.*admin\|is_admin" app/api/admin/seo-pages/` → "Found in all route files"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "All admin routes return 403 for non-admin authenticated users"
- **evidence**: []
- **attempts**: 0
- **details**:
  - Create shared `lib/auth/require-admin.ts` helper function
  - Apply to `app/api/admin/seo-pages/stats/route.ts`
  - Apply to `app/api/admin/seo-pages/[id]/refresh/route.ts`
  - Apply to `app/api/admin/seo-pages/bulk/route.ts`
  - Apply to `app/api/admin/seo-pages/[id]/schedule/route.ts`
  - Check for existing `is_admin()` DB function to leverage
  - **Why**: Any authenticated user can currently bulk publish/delete pages and burn API credits.

### Step 1.3: Fix version numbering race condition
- **passes**: true
- **criteria**:
  - test: `grep "create_page_version\|FOR UPDATE" supabase/migrations/*version*` → "Function exists with locking"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Concurrent version creation produces unique, sequential version numbers"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.1"]
- **details**:
  - Create migration with `create_page_version()` Postgres function using `SELECT ... FOR UPDATE`
  - Add UNIQUE constraint on `(page_id, version_number)` as safety net
  - Update `lib/seo/versioning.ts` to call RPC instead of read-then-insert
  - **Why**: Concurrent cron + bulk refresh produces duplicate version numbers.

### Step 1.4: Fix dashboard loading states that freeze on error
- **passes**: true
- **criteria**:
  - test: `grep -A2 "catch.*err" app/admin/seo-dashboard/use-seo-dashboard.ts` → "setLoading(false) in catch"
  - test: `grep -A2 "catch.*err" app/admin/seo-dashboard/components/PositionTrendChart.tsx` → "setLoading(false) in catch"
  - test: `grep -A2 "catch.*err" app/admin/seo-dashboard/components/DistributionChart.tsx` → "setLoading(false) in catch"
  - test: `grep -A2 "catch.*err" app/admin/seo-dashboard/components/TopMovers.tsx` → "setLoading(false) in catch"
  - principle: "No component can enter permanent loading state on network error"
- **evidence**: []
- **attempts**: 0
- **details**:
  - Add `setLoading(false)` to `.catch()` in `use-seo-dashboard.ts:69-72`
  - Same fix in `PositionTrendChart.tsx:52-56`
  - Same fix in `DistributionChart.tsx:52-56`
  - Same fix in `TopMovers.tsx:47-51`
  - **Why**: Any network error = permanent spinner with no recovery.

---

## PHASE 2: High Priority Bugs

### Step 2.1: Add input validation to API routes
- **passes**: true
- **criteria**:
  - test: `grep "z\.\|zod" app/api/admin/seo-pages/bulk/route.ts` → "Zod schema found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "All request bodies validated with Zod before processing"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `app/api/admin/seo-pages/bulk/route.ts` - Zod: `action` as enum, `pageIds` as `z.array(z.string().uuid()).min(1).max(100)`
  - `app/api/admin/seo-pages/[id]/schedule/route.ts` - Zod: `publish_at` as ISO 8601, max 1 year future
  - `app/api/cron/seo-drip/route.ts` - Verify Vercel cron signature header

### Step 2.2: Fix bulk operation count bugs
- **passes**: true
- **criteria**:
  - test: `grep "count: 'exact'" lib/seo/bulk.ts` → "Found in delete and publish/unpublish"
  - type: `npx tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `lib/seo/bulk.ts:60-75` - Change `.delete()` to `.delete({ count: 'exact' })`
  - `lib/seo/bulk.ts:24-33` - Use `.update({...}).select('id')` with RETURNING instead of separate count query (TOCTOU race fix)

### Step 2.3: Fix content generation bugs
- **passes**: true
- **criteria**:
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "fixVoice correctly handles 'We are' -> 'I am' and recurses into nested content"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `lib/seo/generation.ts:22-23` - Handle "We are" -> "I am", "We were" -> "I was" explicitly
  - `lib/seo/generation.ts:64-66` - Replace greedy `{...}` regex with robust JSON extraction (prefill or tool_use)
  - `lib/seo/generation.ts:74-91` - Make `fixVoice` recursive to match quality gate depth
  - `lib/seo/generation.ts:6` - Add `'testimonial-heavy'` to LAYOUTS array
  - `lib/seo/refresh.ts:57-62` - Pass `newContent.metaDescription` instead of stale `page.meta_description`

### Step 2.4: Fix dashboard data bugs
- **passes**: true
- **criteria**:
  - test: `grep "date.*position\|{ date:" app/admin/seo-dashboard/components/DistributionChart.tsx` → "Map stores date alongside position"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "No redundant API calls from child components"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `DistributionChart.tsx:120` - Fix date-vs-position comparison: store `{ date, position }` in Map
  - Remove independent fetches from `PositionTrendChart`, `DistributionChart`, `TopMovers` - pass data via props from parent hook
  - Remove or implement `cityTier` and `trend` filters (currently decorative)
  - Deduplicate `RankingEntry` interface - use canonical type from `types.ts`
  - Add `AbortController` cleanup to `AlertsPanel.tsx`
  - Add delete confirmation dialog to `handleDeleteKeyword`

### Step 2.5: Fix error handling gaps
- **passes**: true
- **criteria**:
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "All .update()/.insert() calls check error return"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `lib/seo/scheduling.ts:84-91` + `lib/seo/refresh.ts:65-71` - Check `.update()` error, handle failures
  - `lib/seo/serp-tracker.ts:79-81` - Return empty result instead of throwing when no keywords
  - `lib/seo/link-health.ts:69-71` - Add upsert with `(source_slug, target_url)` conflict key
  - Add `error` state to `useSeoDashboard` hook, display toast on API failures

---

## PHASE 3: Performance Optimizations

### Step 3.1: Batch database operations
- **passes**: false
- **criteria**:
  - principle: "GSC sync, link health, and bulk refresh use batched/parallel operations"
- **evidence**: []
- **attempts**: 0
- **details**:
  - `lib/seo/gsc.ts:179-200` - Batch upserts in chunks of 1000 (currently 25K sequential = 8+ min → ~10s)
  - `lib/seo/link-health.ts:46-52` - Parallelize with `p-limit(20)` (currently sequential = 40+ min → ~2 min)
  - `lib/seo/bulk.ts:77-91` - Parallelize `bulkRefresh` in batches of 5 concurrent
  - `lib/seo/link-health.ts:97-101` - Fall back to GET if HEAD returns 405

### Step 3.2: Optimize database queries and indexes
- **passes**: false
- **criteria**:
  - principle: "Stats endpoint uses DB-level aggregation, not client-side loops"
- **evidence**: []
- **attempts**: 0
- **details**:
  - Create migration with `get_seo_status_counts()`, `get_seo_breakdown()` DB functions
  - Update `app/api/admin/seo-pages/stats/route.ts` to use RPC calls
  - Add composite index: `idx_seo_pages_drip_query ON seo_pages(status, route_pattern, city_tier, created_at) WHERE status = 'draft'`
  - Optimize scheduled pages index
  - Add pagination to `versioning.ts` `getVersionHistory` and `rankings/route.ts`
  - Add `updated_at` trigger function

### Step 3.3: Add caching and rate limiting
- **passes**: false
- **criteria**:
  - principle: "Expensive endpoints have rate limits; stats endpoint is cached"
- **evidence**: []
- **attempts**: 0
- **details**:
  - Rate limit on `/api/admin/seo-pages/[id]/refresh` (10/hour)
  - Rate limit on `/api/admin/seo-pages/bulk`
  - Cache stats endpoint with `unstable_cache` (5 min revalidation)
  - SerpAPI rate limiting in `serp-tracker.ts` (1-2s delay)
  - Skip link health URLs checked in last 7 days
  - Replace 5 sequential cron wave queries with single query + app-side sort

---

## PHASE 4: Data Integrity & Polish

### Step 4.1: Add database constraints
- **passes**: false
- **criteria**:
  - principle: "All enum columns have CHECK constraints; FK constraints with CASCADE"
- **evidence**: []
- **attempts**: 0
- **details**:
  - CHECK on `seo_pages.status` (`IN ('draft', 'published')`)
  - CHECK on `seo_alerts.status`, `severity`, `type`
  - FK on `seo_link_checks.source_slug` -> `seo_pages.slug` with CASCADE
  - UNIQUE on `seo_link_checks(source_slug, target_url)` after dedup

### Step 4.2: Add transaction safety
- **passes**: false
- **criteria**:
  - principle: "Multi-step operations (version + update) are atomic"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.3"]
- **details**:
  - Create `publish_scheduled_page()` Postgres function (version creation + status update)
  - Update `lib/seo/scheduling.ts` to use RPC
  - Similar atomic function for `refresh.ts`

### Step 4.3: Content safety and minor fixes
- **passes**: false
- **criteria**:
  - type: `npx tsc --noEmit` → "No errors"
  - lint: `npx next lint` → "No errors"
- **evidence**: []
- **attempts**: 0
- **details**:
  - Add DOMPurify sanitization for AI content before storage
  - Add quality gate HTML tag detection
  - Sanitize JSON-LD output
  - Fix URL query string construction (use `URLSearchParams`) across 4 files
  - Fix CSV export to include `siteId` filter
  - Fix `quality-gate.ts:86` word count for empty string
  - Add `aria-label` to delete keyword and resolve alert buttons
  - Validate `parseInt` in `generate-seo-content.ts` CLI
  - Validate env vars at script startup
  - Replace O(n*m) slug parsing with Map lookup in `internal-links.ts`
  - Fix `export.ts` to return header row on empty data
  - Clean up `index.ts` barrel exports

---

## Files to Modify

### Core Library (lib/seo/)
- `lib/seo/versioning.ts` - Switch to adminClient, use RPC for atomic versioning
- `lib/seo/alerts.ts` - Switch to adminClient
- `lib/seo/gsc.ts` - Switch to adminClient, batch upserts
- `lib/seo/queries.ts` - Move client creation into functions
- `lib/seo/bulk.ts` - Fix count bugs, parallelize refresh
- `lib/seo/generation.ts` - Fix fixVoice, JSON extraction, add layout
- `lib/seo/refresh.ts` - Fix meta versioning, add error handling
- `lib/seo/scheduling.ts` - Use atomic RPC, add error handling
- `lib/seo/link-health.ts` - Parallelize, upsert, cache, HEAD fallback
- `lib/seo/serp-tracker.ts` - Rate limiting, graceful empty keywords
- `lib/seo/quality-gate.ts` - Fix word count edge case
- `lib/seo/internal-links.ts` - Map lookup instead of O(n*m)
- `lib/seo/export.ts` - Return header on empty data
- `lib/seo/index.ts` - Clean up barrel exports

### API Routes
- `app/api/admin/seo-pages/stats/route.ts` - Admin check, DB aggregation, caching
- `app/api/admin/seo-pages/[id]/refresh/route.ts` - Admin check, rate limiting
- `app/api/admin/seo-pages/bulk/route.ts` - Admin check, Zod validation, rate limiting
- `app/api/admin/seo-pages/[id]/schedule/route.ts` - Admin check, Zod validation
- `app/api/cron/seo-drip/route.ts` - Vercel signature verification, single query

### Dashboard
- `app/admin/seo-dashboard/use-seo-dashboard.ts` - Fix loading catch, add error state
- `app/admin/seo-dashboard/page.tsx` - Fix CSV export links
- `app/admin/seo-dashboard/components/DistributionChart.tsx` - Fix date bug, remove independent fetch
- `app/admin/seo-dashboard/components/PositionTrendChart.tsx` - Fix loading, remove independent fetch
- `app/admin/seo-dashboard/components/TopMovers.tsx` - Fix loading, remove independent fetch
- `app/admin/seo-dashboard/components/AlertsPanel.tsx` - Add AbortController, aria-label
- `app/admin/seo-dashboard/components/KeywordManager.tsx` - Delete confirmation, aria-label
- `app/admin/seo-dashboard/components/RankingFilters.tsx` - Remove/implement dead filters
- `app/admin/seo-dashboard/types.ts` - Canonical RankingEntry used everywhere

### New Files
- `lib/auth/require-admin.ts` - Shared admin verification helper
- `supabase/migrations/YYYYMMDD_version_function.sql` - Atomic version creation
- `supabase/migrations/YYYYMMDD_publish_function.sql` - Atomic scheduled publish
- `supabase/migrations/YYYYMMDD_stats_functions.sql` - Aggregation functions
- `supabase/migrations/YYYYMMDD_constraints.sql` - CHECK constraints, FKs, indexes
- `supabase/migrations/YYYYMMDD_updated_at_trigger.sql` - Auto timestamp trigger

### Other
- `scripts/generate-seo-content.ts` - Env validation, parseInt check
- `components/seo/components.tsx` - DOMPurify sanitization

---

## Perspective Prompts

### P1: SIMPLICITY
**Prompt**: "Fix pSEO pipeline issues - Focus on SIMPLICITY: Minimize code changes per fix. Prefer small, targeted edits over architectural rewrites. Each fix should be independently deployable."
**Goal**: Minimal diff per issue, no over-engineering

### P2: ROBUSTNESS
**Prompt**: "Fix pSEO pipeline issues - Focus on ROBUSTNESS: Ensure all error paths are handled. No silent failures. Every database operation checks its error return. Loading states always resolve."
**Goal**: Zero silent failures in cron jobs and dashboard

### P3: PERFORMANCE
**Prompt**: "Fix pSEO pipeline issues - Focus on PERFORMANCE: Batch all sequential DB operations. Parallelize HTTP calls with concurrency limits. Move aggregation to database. Add caching where data changes infrequently."
**Goal**: 90%+ reduction in bulk operation times

### P4: SECURITY
**Prompt**: "Fix pSEO pipeline issues - Focus on SECURITY: Enforce admin role on all admin routes. Validate all inputs with Zod. Sanitize AI-generated content. Strengthen cron authentication."
**Goal**: No unauthorized access to admin operations

### P5: MAINTAINABILITY
**Prompt**: "Fix pSEO pipeline issues - Focus on MAINTAINABILITY: Consolidate duplicate types. Use shared helpers for common patterns (admin check, client creation). Clean up barrel exports."
**Goal**: Single source of truth for types and patterns

### P6: TESTABILITY
**Prompt**: "Fix pSEO pipeline issues - Focus on TESTABILITY: Ensure fixes are verifiable via grep/type checks. Add database constraints that enforce correctness. Use atomic DB functions testable via RPC."
**Goal**: Each fix has a verifiable criteria

### P7: SCALABILITY
**Prompt**: "Fix pSEO pipeline issues - Focus on SCALABILITY: Ensure operations work at 10K+ pages. Add pagination, indexes, batch processing. Prevent unbounded table growth."
**Goal**: Pipeline handles 10x current data volume

### P8: USABILITY
**Prompt**: "Fix pSEO pipeline issues - Focus on USABILITY: Add error feedback to dashboard. Fix dead filters. Add delete confirmations. Ensure loading states always resolve."
**Goal**: Dashboard shows accurate data and clear error states

### P9: COMPATIBILITY
**Prompt**: "Fix pSEO pipeline issues - Focus on COMPATIBILITY: Ensure migrations are backwards-compatible. New DB functions don't break existing queries. Client changes work in both cron and request contexts."
**Goal**: Zero-downtime deployment of all fixes

---

## Integration Notes

- Phase 1 fixes are independent and can be deployed immediately
- Phase 2 dashboard changes should be deployed together (data flow refactor)
- Phase 3 migrations should be applied before code changes that reference new functions
- Phase 4 constraints migration should verify no existing data violations first

## Expected Conflicts

- P1 (Simplicity) vs P7 (Scalability): Batching adds complexity but is necessary for scale
- P3 (Performance) vs P4 (Security): Rate limiting adds latency but prevents abuse
- P1 (Simplicity) vs P5 (Maintainability): Consolidating types touches many files

## Decisions Made

(To be filled during execution)

## Outcome

(To be filled at completion)
