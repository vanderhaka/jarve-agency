# Ensemble Execution Plan

**Status**: Complete
**Complexity**: 29/100 → 2 agents
**Created**: 2026-02-01
**Branch**: main

## Questions & Clarifications

None - requirements are clear

## Objective

Add pSEO content pipeline status to the existing SEO dashboard (`/admin/seo-dashboard`) so James can see publishing progress, indexing status, and page performance alongside SERP rankings.

## Agent Type: frontend-developer

## Tasks

### Track 1: pSEO Content Status Section

#### Step 1.1: Create API endpoint for pSEO stats
- **passes**: true
- **criteria**:
  - test: `curl -s localhost:3000/api/admin/seo-pages/stats` → "published"
  - type: `tsc --noEmit` → "No errors"
- **evidence**: []
- Create `app/api/admin/seo-pages/stats/route.ts`
- Returns:
  - Published count, draft count, total
  - Breakdown by route_pattern (services-city, industries, etc.)
  - Breakdown by city_tier
  - Recently published pages (last 7 days)
  - Estimated completion date (remaining ÷ 5/day)
  - Pages with quality_issues in content

#### Step 1.2: Add content pipeline cards to dashboard
- **passes**: true
- **criteria**:
  - principle: "Dashboard shows published/draft/total counts with progress bar"
- **evidence**: []
- **blocked_by**: ["1.1"]
- Add above the existing SERP section:
  - **Published / Total** card with progress bar (e.g. "13 / 187 — 7%")
  - **Drip Rate** card showing "5 pages/day"
  - **Est. Completion** card showing projected date
  - **Quality Issues** card showing count of pages with issues

#### Step 1.3: Add content breakdown table
- **passes**: true
- **criteria**:
  - principle: "Table shows published/draft per route pattern and city tier"
- **evidence**: []
- **blocked_by**: ["1.1"]
- Table with columns: Route Pattern | Tier | Published | Draft | Total
- Rows: services-city (tier 1), services-city (tier 2), industries, industries-city, solutions, comparisons

### Track 2: Page Performance & Indexing

#### Step 2.1: Add recently published pages list
- **passes**: true
- **criteria**:
  - principle: "Shows last 10 published pages with date and link"
- **evidence**: []
- **blocked_by**: ["1.1"]
- Table: Page Title | URL Path | Published Date
- Each row links to the live page

#### Step 2.2: Add page-level ranking correlation
- **passes**: true
- **criteria**:
  - principle: "Shows which pSEO pages appear in SERP data"
- **evidence**: []
- **blocked_by**: ["1.1"]
- Cross-reference `seo_pages` (published) with `serp_rankings` (url field)
- Show: pages ranking vs not ranking yet
- Card: "X of Y published pages appearing in search results"

## Files to Modify

| File | Change |
|------|--------|
| `app/api/admin/seo-pages/stats/route.ts` | New — pSEO stats endpoint |
| `app/admin/seo-dashboard/page.tsx` | Add content pipeline section above SERP section |

## Dependencies

- Existing `seo_pages` table with status, route_pattern, city_tier columns
- Existing SERP ranking data in `serp_rankings` table
