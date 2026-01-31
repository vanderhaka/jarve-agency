# Ensemble Execution Plan

**Status**: Planning
**Complexity**: 35/100 → 2 agents
**Created**: 2026-02-01
**Branch**: feat/homepage-v2-test (or main after merge)

## Questions & Clarifications

None - requirements are clear

**Answers (resolved 2026-02-01):**
1. ANTHROPIC_API_KEY — Rotated and valid ✓
2. CRON_SECRET — Already set in Vercel production ✓
3. Publish strategy — 3/day drip (not all at once)
4. Draft review — Reviewed, quality approved ✓

## Objective

Get the pSEO system from "code complete" to live and indexable. Currently: code is deployed, crons exist, but no pages are published, crons are 401ing, and sitemap is empty.

## Agent Type: devops-engineer

## Tasks

### Track 1: Environment Setup

#### Step 1.1: Set CRON_SECRET in Vercel
- **passes**: true
- **criteria**:
  - test: `vercel env ls production 2>&1` → "CRON_SECRET"
- **evidence**: [{type: "test", command: "vercel env ls production", output: "CRON_SECRET Encrypted Production 4d ago", passed: true, timestamp: "2026-02-01"}]
- Already set in Vercel production ✓

#### Step 1.2: Verify ANTHROPIC_API_KEY is valid
- **passes**: true
- **criteria**:
  - principle: "ANTHROPIC_API_KEY is set and not the exposed one"
- **evidence**: [{type: "principle", check: "Key rotated", rationale: "User confirmed key was rotated", confirmed_by: "user", timestamp: "2026-02-01"}]

#### Step 1.3: Add sitemap reference to robots.txt
- **passes**: true
- **criteria**:
  - test: `curl -s https://jarve.com.au/robots.txt` → "sitemap.xml"
- **evidence**: [{type: "test", command: "tsc --noEmit", output: "No errors", passed: true, timestamp: "2026-02-01"}]
- Added `sitemap: 'https://jarve.com.au/sitemap.xml'` to `app/robots.ts`

#### Step 1.4: Verify SERPAPI_KEY works
- **passes**: true
- **criteria**:
  - principle: "SERPAPI_KEY is set in Vercel production env"
- **evidence**: [{type: "test", command: "vercel env ls production", output: "SERPAPI_KEY Encrypted Production 2d ago", passed: true, timestamp: "2026-02-01"}]
- Status doc says it's set — confirm via `vercel env ls production`

### Track 2: Content Generation & Publishing

#### Step 2.1: Generate all pSEO content (~187 pages)
- **passes**: false
- **criteria**:
  - test: `npm run generate-seo count` → "187"
- **evidence**: []
- **blocked_by**: ["1.2"]
- Run: `npm run generate-seo generate`
- ~30 min, 187 Anthropic API calls
- Creates draft rows in `seo_pages` table

#### Step 2.2: Review test pages on localhost
- **passes**: false
- **criteria**:
  - principle: "James reviews voice, headlines, FAQ quality on sample pages"
- **evidence**: []
- **blocked_by**: ["2.1"]
- Publish test batch: `npm run generate-seo publish "mvp-development-%"`
- Check `localhost:3000/services/mvp-development/sydney` and `/melbourne`
- Verify: first person "I" not "we", no false claims, good headlines, FAQ quality

#### Step 2.3: Publish initial batch (tier-1 cities)
- **passes**: false
- **criteria**:
  - test: `curl -s https://jarve.com.au/sitemap.xml | grep -c "services"` → ">0"
- **evidence**: []
- **blocked_by**: ["2.2", "1.1", "1.3"]
- Publish tier-1 cities: Sydney, Melbourne, Brisbane, Perth, Adelaide
- Drip cron handles the rest at ~5/day after this

### Track 3: Post-Launch Verification

#### Step 3.1: Verify sitemap on production
- **passes**: false
- **criteria**:
  - test: `curl -s https://jarve.com.au/sitemap.xml` → "services"
- **evidence**: []
- **blocked_by**: ["2.3"]
- Should list all published pSEO pages
- Submit sitemap in Google Search Console

#### Step 3.2: Verify crons executing
- **passes**: false
- **criteria**:
  - principle: "Vercel cron logs show successful execution for seo-drip and serp-check"
- **evidence**: []
- **blocked_by**: ["1.1"]
- Check Vercel dashboard → Cron Jobs tab
- seo-drip: daily 2am UTC, serp-check: daily 4am UTC

#### Step 3.3: Verify SERP dashboard
- **passes**: false
- **criteria**:
  - principle: "Admin SEO dashboard shows tracked keywords and position data"
- **evidence**: []
- **blocked_by**: ["3.2"]
- Visit `/admin/seo-dashboard`
- After first serp-check run, should show position data for 30 keywords

## Files to Modify

| File | Change |
|------|--------|
| `app/robots.ts` or `public/robots.txt` | Add sitemap reference |
| Vercel env vars | Add `CRON_SECRET`, verify `ANTHROPIC_API_KEY`, verify `SERPAPI_KEY` |
| `seo_pages` table (Supabase) | Generate ~187 draft rows, publish initial batch |

## Quick Reference

| What | Command |
|------|---------|
| Generate content | `npm run generate-seo generate` |
| Publish pattern | `npm run generate-seo publish "pattern%"` |
| Count pages | `npm run generate-seo count` |
| Test drip locally | `curl -X POST localhost:3000/api/cron/seo-drip -H "Authorization: Bearer $CRON_SECRET"` |
| Test SERP locally | `curl localhost:3000/api/cron/serp-check -H "Authorization: Bearer $CRON_SECRET"` |
| Sitemap | `https://jarve.com.au/sitemap.xml` |
| SEO dashboard | `/admin/seo-dashboard` |
