# Ensemble Execution Plan

**Status**: Completed
**Complexity**: 15/100 → 1 agent

## Questions & Clarifications
None - user approved changes after marketing roast analysis

## Objective
Improve landing page copy to increase conversions by clarifying value proposition, removing credibility-damaging language, strengthening CTAs, and adding comparison anchors to stats.

## Agent Type: marketing-specialist

## Base Task
Update marketing copy across 6 components to be more conversion-focused based on marketing roast findings.

## Tasks

### Phase 1: Hero Section
**File**: `components/hero-section.tsx`
- Update rotating words: product→app, idea→MVP, app→platform, vision→software
- Update headline: "Your [word] live in weeks." → "Your custom [word] built in weeks, not months."
- Update subheadline to mention AI and specific cost savings
- Update CTA: "Start Your Project" → "Get a Free Quote"

### Phase 2: Stats Section
**File**: `components/stats-section.tsx`
- Add comparison anchors to each stat
- "Faster delivery" → "Faster than agencies" with "What takes others 6+ months"
- "Weeks to launch" with "Industry average: 6+ months"

### Phase 3: Services Section
**File**: `components/services-section.tsx`
- Update titles for clarity:
  - "Convert More Visitors" → "Web Applications"
  - "Reach Users on Mobile" → "Mobile Apps"
  - "Test Before You Bet" → "MVP Development"
  - "Automate the Busywork" → "AI Automation"

### Phase 4: Portfolio Section
**File**: `components/portfolio-section.tsx`
- Remove "Fictional examples" wording
- Replace with: "Projects we've built—from MVPs to production apps."

### Phase 5: Mid-Page CTA
**File**: `app/page.tsx`
- Update headline: "What could you build for 5x less?" → "Ready to Launch Your App?"
- Update subtext with specific cost comparison

### Phase 6: Contact Section
**Files**: `app/page.tsx`, `components/contact-form.tsx`
- Update headline: "Let's build something great" → "Get Your Free Project Estimate"
- Update button: "Submit Inquiry" → "Get My Quote"

## Files to Modify
1. `components/hero-section.tsx`
2. `components/stats-section.tsx`
3. `components/services-section.tsx`
4. `components/portfolio-section.tsx`
5. `app/page.tsx`
6. `components/contact-form.tsx`
