# Ensemble Execution Plan

**Status**: Completed
**Complexity**: 5/100 → 1 agent

## Questions & Clarifications
None

## Objective
1. Fix invisible text on pSEO pages caused by framer-motion animation freezing
2. Remove false experience claims from LLM prompt

## Agent Type: frontend-developer

## Tasks

### Phase 1: Fix rendering
- [x] Replace framer-motion FadeIn with CSS IntersectionObserver in `components/fade-in.tsx`
- [x] Verify Sydney and Melbourne pages render correctly

### Phase 2: Fix false claims in prompt
- [x] Update localSignals instructions to remove "past work in this city's industries"
- [x] Add "No False Claims" section to prompt quality checks

## Files to Modify
- `components/fade-in.tsx`
- `scripts/generate-seo-content.ts`
