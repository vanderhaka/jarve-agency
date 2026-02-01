# Ensemble Execution Plan

**Status**: Planning
**Complexity**: 25/100 (LOW)
**Agents**: 1-2 (SIMPLICITY, MAINTAINABILITY)
**Started**: 2026-02-01
**Updated**: 2026-02-01

---

## Questions & Clarifications

1. **Naming convention**: Should we rename the spec to use "city" (matching code) or rename code to use "location" (matching spec)?
2. **Scope**: Update spec to match code only, or also update code where quick wins exist?
3. **Roadmap sections**: Keep unimplemented features as a "Roadmap" section, or remove them entirely?

---

## Objective

Update `seo-dash-align.md` to accurately reflect the current codebase, separating implemented features from roadmap items. Fix naming mismatches, schema discrepancies, and mark implementation status throughout.

---

## Agent Type: documentation-specialist

Primary agent for spec rewriting. May use `Explore` agent for codebase verification.

---

## Tasks

### Phase 1: Fix Naming & Structure
- [ ] 1.1 Normalize terminology (city vs location) throughout spec
- [ ] 1.2 Fix route pattern names to match code (`services-city`, `industries-city`, `comparisons`, `solutions`)
- [ ] 1.3 Fix URL structures to match actual routes (`/services/{service}/{city}`)
- [ ] 1.4 Remove or mark `service-hub` and `location-hub` patterns as planned

### Phase 2: Fix Database Schema
- [ ] 2.1 Update `seo_pages` schema to match actual columns
- [ ] 2.2 Fix table names (remove `seo_` prefix where code doesn't use it)
- [ ] 2.3 Fix tier constraint (1-2 not 1-3)
- [ ] 2.4 Mark non-existent tables as "Planned"
- [ ] 2.5 Fix `ranking_history` schema (`date` not `checked_at`)

### Phase 3: Fix Content Types & API
- [ ] 3.1 Update `SeoContent` interface (`cityContext` not `localContext`, remove missing fields)
- [ ] 3.2 Update API endpoints list - mark implemented vs planned
- [ ] 3.3 Update file structure to match flat layout
- [ ] 3.4 Fix status enum to match actual usage (`draft`, `published`)

### Phase 4: Add Implementation Status
- [ ] 4.1 Add status badges (Implemented/Planned) to each section
- [ ] 4.2 Update implementation checklist with actual completion state
- [ ] 4.3 Split checklist into "Done" and "Roadmap"

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `seo-dash-align.md` | EDIT | Main spec - fix all naming, schemas, status markers |

---

## Notes

- Source of truth: the **codebase** (not the spec)
- Alignment report from master-orchestrator agent has full diff details
