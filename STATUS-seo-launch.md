# pSEO Launch Status

**Date**: 2026-02-01
**Branch**: feat/homepage-v2-test
**Status**: Awaiting merge to main for production deploy

---

## What's Done

### Environment (Track 1) ✓
- [x] `CRON_SECRET` set in Vercel production
- [x] `ANTHROPIC_API_KEY` rotated and valid
- [x] `SERPAPI_KEY` set in Vercel production
- [x] Sitemap reference added to `app/robots.ts`
- [x] Aggressive bot blocking added (15 user-agents blocked in robots.txt)
- [x] Drip batch size set to 3/day

### Content (Track 2) — Partially Complete
- [x] 187 pages generated with content (all have heroHeadline, FAQ, etc.)
- [x] Draft quality reviewed and approved
- [x] Initial batch published: 10 tier-1 city pages
- [ ] Remaining 177 pages publish via daily drip cron (3/day ≈ 59 days)

### Published Pages (10)
| Page | URL Path |
|------|----------|
| mvp-development-sydney | /services/mvp-development/sydney |
| mvp-development-melbourne | /services/mvp-development/melbourne |
| mvp-development-brisbane | /services/mvp-development/brisbane |
| mvp-development-perth | /services/mvp-development/perth |
| mvp-development-adelaide | /services/mvp-development/adelaide |
| web-app-development-sydney | /services/web-app-development/sydney |
| web-app-development-melbourne | /services/web-app-development/melbourne |
| web-app-development-brisbane | /services/web-app-development/brisbane |
| web-app-development-perth | /services/web-app-development/perth |
| web-app-development-adelaide | /services/web-app-development/adelaide |

### Remaining Drafts (177)
| Route Pattern | Count |
|---------------|-------|
| services-city | 80 |
| industries-city | 60 |
| solutions | 15 |
| comparisons | 10 |
| industries | 12 |

---

## Verification Checklist (Post-Merge to Main)

### Immediate (after deploy)
- [ ] Visit https://jarve.com.au/robots.txt — should show sitemap reference + blocked bots
- [ ] Visit https://jarve.com.au/sitemap.xml — should list 10 published service pages
- [ ] Visit https://jarve.com.au/services/mvp-development/sydney — should render full page
- [ ] Visit https://jarve.com.au/services/web-app-development/melbourne — should render full page
- [ ] Check page has: headline, FAQ, CTA, meta title/description (view source)

### Within 24 hours
- [ ] Check Vercel Cron Jobs tab — `seo-drip` should show successful run at 2am UTC
- [ ] Check Vercel Cron Jobs tab — `serp-check` should show successful run at 4am UTC
- [ ] Verify 3 new pages published after first drip run
- [ ] Submit sitemap to Google Search Console

### Within 1 week
- [ ] Check /admin/seo-dashboard — should show SERP position data for tracked keywords
- [ ] Verify drip is publishing consistently (should be ~21 more pages after 7 days)
- [ ] Check Vercel usage/billing — confirm no unexpected spikes from bots

### Billing Safety
- [ ] Set Vercel Spend Management cap (Settings → Billing → Spend Management)
- [ ] Consider Vercel Firewall rules if on Pro plan (blocks at edge, zero compute cost)

---

## Tiered Rollout Checks (Tier 1 → Tier 2)

### Database (already migrated)
- [x] Migration applied: `20260131000001_add_seo_city_tier.sql`
- [ ] `seo_pages.city_tier` backfilled for existing city pages (services-city + industries-city)
- [ ] Index exists: `idx_seo_pages_route_pattern_city_tier_created_at`

### Content Inventory
- [ ] Confirm tier-2 drafts exist for industries-city (expect 12 industries × 10 tier-2 cities = 120)
- [ ] Confirm tier-1 drafts still present for industries-city (12 × 5 = 60)
- [ ] Confirm services-city has 90 total drafts (6 services × 15 cities)

### Drip Order Validation
- [ ] Trigger `seo-drip` once and confirm it publishes only tier-1 city pages until tier-1 is exhausted
- [ ] Confirm `seo-drip` continues into tier-2 after tier-1 drafts are cleared

### Sitemap / Render
- [ ] After tier-2 starts, verify `/sitemap.xml` includes tier-2 city URLs
- [ ] Manually load one tier-2 industry-city page (e.g. `/industries/{industry}/{tier2-city}`) and confirm full render + FAQ JSON-LD

---

## Blockers

1. **Merge to main required** — All code changes are on `feat/homepage-v2-test`. Nothing is live until merged and deployed.

## Files Changed

| File | Change |
|------|--------|
| `app/robots.ts` | Added sitemap ref + blocked 15 bot user-agents |
| `app/api/cron/seo-drip/route.ts` | BATCH_SIZE 2 → 3 |
| `PLAN-seo-launch.md` | Resolved questions, marked Track 1 complete |
