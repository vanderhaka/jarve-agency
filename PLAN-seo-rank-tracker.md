# Ensemble Execution Plan

**Status**: Completed
**Complexity**: 35/100 → 3 agents

## Questions & Clarifications

- [x] API choice → SerpAPI ($75/mo, 5,000 searches)
- [x] Frequency → Daily (4am UTC)
- [x] Which sites to track initially? → jarve.com.au
- [x] How many keywords per site? → 30
- [x] Dashboard location → `/admin/seo-dashboard`

## Objective

Build a daily SEO rank tracking system: SerpAPI fetches SERP positions for configured keywords across multiple sites, stores results in Supabase, and displays trends on an admin dashboard with Recharts graphs.

## Agent Type: fullstack-developer

## Architecture

```
SerpAPI ──→ /api/cron/serp-check ──→ Supabase (ranking_history)
                                          │
                                          ▼
                              /admin/seo-rankings (Recharts)
```

## Tasks

### Track 1: Database Schema
- [x] **1.1** Create `tracked_sites` table (id, domain, name, active, created_at)
- [x] **1.2** Create `tracked_keywords` table (id, site_id FK, keyword, active, created_at)
- [x] **1.3** Create `ranking_history` table (id, keyword_id FK, position, url, date, serp_data JSONB, created_at)
- [x] **1.4** Add indexes on (keyword_id, date) and (date)

### Track 2: Cron Job — `/api/cron/serp-check`
- [x] **2.1** Create route handler with CRON_SECRET validation (match existing seo-drip pattern)
- [x] **2.2** Fetch active sites + keywords from Supabase
- [x] **2.3** Call SerpAPI for each keyword, extract position for target domain
- [x] **2.4** Insert results into ranking_history
- [x] **2.5** Add to vercel.json cron schedule (daily, offset from seo-drip)
- [x] **2.6** Handle rate limits / errors gracefully

### Track 3: API Routes for Dashboard
- [x] **3.1** `GET /api/admin/rankings` — ranking data with date range + site filter
- [x] **3.2** `GET /api/admin/rankings/summary` — top movers, avg position, keyword count

### Track 4: Admin Dashboard Page
- [x] **4.1** Create `/admin/seo-rankings/page.tsx`
- [x] **4.2** Position over time line chart (Recharts) — multi-keyword
- [x] **4.3** Summary cards: avg position, keywords tracked, biggest movers
- [x] **4.4** Site selector dropdown (multi-site)
- [x] **4.5** Date range filter (7d, 30d, 90d)
- [x] **4.6** Keywords table with current position, change, best position

### Track 5: Seed & Config
- [x] **5.1** Admin UI or seed script to add sites + keywords
- [x] **5.2** Add SERPAPI_KEY to Vercel env vars
- [x] **5.3** Seed initial site (jarve.com.au) + pSEO target keywords

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/YYYYMMDD_seo_ranking_tables.sql` | Create | DB schema |
| `app/api/cron/serp-check/route.ts` | Create | Daily cron job |
| `app/api/admin/rankings/route.ts` | Create | Dashboard data API |
| `app/api/admin/rankings/summary/route.ts` | Create | Summary stats API |
| `app/admin/seo-rankings/page.tsx` | Create | Dashboard page |
| `lib/seo/serp-tracker.ts` | Create | SerpAPI client + helpers |
| `vercel.json` | Modify | Add cron schedule |

## Cost Estimate
- SerpAPI $75/mo → 5,000 searches
- 1 site × 30 keywords × 1/day = 900/mo (room for 4+ more sites)
