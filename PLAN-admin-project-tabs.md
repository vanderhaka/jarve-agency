# Ensemble Execution Plan

**Status**: Executing
**Complexity**: 45/100 (Complex)
**Agents**: 7 (P1-P7)
**Started**: 2026-01-28
**Updated**: 2026-01-28

---

## Questions & Clarifications

> **RESOLVED**

1. ~~Should **Overview** be the default tab instead of Tasks?~~ → **Yes, Overview is default**
2. ~~Should `/admin/projects/[id]/chat` redirect to tab or remain standalone?~~ → **Redirect to tab**
3. ~~Should tabs be visually grouped or flat?~~ → **Flat (single row)**

---

## Objective
Enhance the admin project detail page to include Overview, Chat, Docs, Uploads, and Finance tabs matching client portal functionality while retaining admin-specific features.

## Analysis
The admin project page currently has 3 tabs (Tasks, Milestones, Change Requests) while the client portal has 5 tabs (Overview, Chat, Docs, Uploads, Invoices). Finance tab code exists but isn't wired up. This is a multi-file refactor requiring new components, data layers, and tab navigation updates. Score: 45 (multi-file +15, implementation +15, moderate scope +15).

---

## Agent Type: frontend-developer

## Base Task
Add 5 new tabs to admin project page: Overview, Chat (from existing page), Docs (adapt from portal), Uploads (adapt from portal), Finance (wire up existing code).

---

## Tasks

- [x] Phase 0: Research (gather context)
- [x] Phase 0.5: Clarify (answer questions)
- [x] Phase 1: Plan (this document)
- [x] Phase 2: Execute (7 agents with perspectives)
- [ ] Phase 3: Review (synthesize outputs)
- [ ] Phase 4: Validate (tests, types, lint)
- [ ] Phase 5: Deliver (present result)

### Implementation Tasks (Micro-Steps)

---

### Track 1: Wire Up Finance Tab (Quick Win)

#### Step 1.1: Add finance to tab type definitions
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **file**: `app/admin/projects/[id]/project-tabs.tsx`
- **action**: Add 'finance' to currentTab union type

#### Step 1.2: Add Finance tab trigger and content
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
  - test: Visual - Finance tab appears in UI
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.1"]
- **file**: `app/admin/projects/[id]/project-tabs.tsx`

#### Step 1.3: Update page.tsx for finance data
- **passes**: true
- **criteria**:
  - test: Finance tab loads without console errors
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.2"]
- **file**: `app/admin/projects/[id]/page.tsx`

---

### Track 2: Create Overview Tab

#### Step 2.1: Create admin overview component
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
  - principle: "Shows project status, client info, quick stats"
- **evidence**: []
- **attempts**: 0
- **file**: `app/admin/projects/[id]/tabs/overview/index.tsx` (NEW)

#### Step 2.2: Create overview data fetching
- **passes**: true
- **criteria**:
  - test: Data loads correctly
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["2.1"]
- **file**: `app/admin/projects/[id]/tabs/overview/data.ts` (NEW)

#### Step 2.3: Wire up overview tab
- **passes**: true
- **criteria**:
  - test: Overview tab renders with project data
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["2.1", "2.2"]

---

### Track 3: Move Chat Into Tab

#### Step 3.1: Create tab-compatible chat component
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **file**: `app/admin/projects/[id]/tabs/chat/index.tsx` (NEW)

#### Step 3.2: Wire up chat tab
- **passes**: true
- **criteria**:
  - test: Chat tab shows messages and allows sending
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["3.1"]

#### Step 3.3: Update standalone chat page
- **passes**: true
- **criteria**:
  - principle: "Redirect to tab or keep for direct linking"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["3.2"]
- **file**: `app/admin/projects/[id]/chat/page.tsx`

---

### Track 4: Create Docs Tab

#### Step 4.1: Create admin docs component
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **file**: `app/admin/projects/[id]/tabs/docs/index.tsx` (NEW)

#### Step 4.2: Create docs server actions
- **passes**: true
- **criteria**:
  - test: Documents load for project
  - principle: "Uses admin client, not portal token"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["4.1"]
- **file**: `app/admin/projects/[id]/tabs/docs/actions.ts` (NEW)

#### Step 4.3: Wire up docs tab
- **passes**: true
- **criteria**:
  - test: Docs tab shows documents with view/download
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["4.1", "4.2"]

---

### Track 5: Create Uploads Tab

#### Step 5.1: Create admin uploads component
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **file**: `app/admin/projects/[id]/tabs/uploads/index.tsx` (NEW)

#### Step 5.2: Create uploads server actions
- **passes**: true
- **criteria**:
  - test: Uploads load and file upload works
  - principle: "Uploads as 'owner' type"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["5.1"]
- **file**: `app/admin/projects/[id]/tabs/uploads/actions.ts` (NEW)

#### Step 5.3: Wire up uploads tab
- **passes**: true
- **criteria**:
  - test: Uploads tab shows files with upload/download
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["5.1", "5.2"]

---

### Track 6: Navigation Updates

#### Step 6.1: Update all Props interfaces
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **file**: `app/admin/projects/[id]/project-tabs.tsx`

#### Step 6.2: Update page.tsx with parallel data fetching
- **passes**: true
- **criteria**:
  - type: `tsc --noEmit` → "No errors"
  - principle: "All data fetched in parallel with Promise.all()"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["6.1"]
- **file**: `app/admin/projects/[id]/page.tsx`

#### Step 6.3: Remove chat button from header
- **passes**: true
- **criteria**:
  - test: Chat button no longer visible in header
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["3.2"]
- **file**: `app/admin/projects/[id]/project-header.tsx`

---

### Track 7: Testing

#### Step 7.1: Manual testing all tabs
- **passes**: false
- **criteria**:
  - test: All 8 tabs render correctly
  - test: Tab switching updates URL param
  - test: Finance invoice creation works
  - test: Chat message sending works
  - test: Docs view/download works
  - test: Uploads upload/download works
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["1.3", "2.3", "3.2", "4.3", "5.3", "6.3"]

#### Step 7.2: Responsive layout check
- **passes**: false
- **criteria**:
  - test: Tabs scrollable on mobile
  - test: Content adjusts to viewport
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["7.1"]

---

## Files to Modify

### Existing Files
- `app/admin/projects/[id]/page.tsx` - Add data fetching for new tabs
- `app/admin/projects/[id]/project-tabs.tsx` - Add 5 new tab triggers and content
- `app/admin/projects/[id]/project-header.tsx` - Remove chat button
- `app/admin/projects/[id]/chat/page.tsx` - Add redirect to tab

### New Files to Create
```
app/admin/projects/[id]/tabs/
  overview/
    index.tsx      # Admin overview component
    data.ts        # Data fetching functions
  chat/
    index.tsx      # Tab-compatible chat
  docs/
    index.tsx      # Admin docs vault
    actions.ts     # Server actions for docs
  uploads/
    index.tsx      # Admin uploads manager
    actions.ts     # Server actions for uploads
```

### Reference Files (Adapt From)
- `app/portal/[token]/components/docs-vault.tsx`
- `app/portal/[token]/components/uploads-manager.tsx`
- `app/admin/projects/[id]/chat/admin-chat-interface.tsx`
- `app/admin/projects/[id]/tabs/finance/index.tsx`

---

## Perspective Prompts

### P1: SIMPLICITY
**Prompt**: "Add tabs to admin project page - Focus on SIMPLICITY: Reuse existing components, minimal new code, adapt portal components directly"
**Goal**: Minimal lines of new code, maximum reuse

### P2: ROBUSTNESS
**Prompt**: "Add tabs to admin project page - Focus on ROBUSTNESS: Handle loading states, errors, empty states for all tabs"
**Goal**: No crashes on edge cases

### P3: SECURITY
**Prompt**: "Add tabs to admin project page - Focus on SECURITY: Use correct Supabase clients, verify RLS policies work for admin access"
**Goal**: No unauthorized data access

### P4: MAINTAINABILITY
**Prompt**: "Add tabs to admin project page - Focus on MAINTAINABILITY: Consistent patterns across tabs, clear separation of concerns"
**Goal**: Easy to add future tabs

### P5: PERFORMANCE
**Prompt**: "Add tabs to admin project page - Focus on PERFORMANCE: Parallel data fetching, lazy load tab content"
**Goal**: Fast initial load, responsive tab switching

### P6: USABILITY
**Prompt**: "Add tabs to admin project page - Focus on USABILITY: Clear tab labels, logical order, keyboard navigation"
**Goal**: Intuitive admin experience

### P7: TESTABILITY
**Prompt**: "Add tabs to admin project page - Focus on TESTABILITY: Components can be tested in isolation, actions are unit testable"
**Goal**: Each tab independently verifiable

---

## Integration Notes
- All tabs share the same page.tsx data fetching pattern
- Tab components receive props from parent, don't fetch their own initial data
- Server actions follow existing patterns in `/lib/` directories
- Use same UI components (Card, Badge, Button) for consistency

## Expected Conflicts
- **P1 vs P4**: Simple copy-paste vs abstracted shared components → favor simplicity for v1
- **P3 vs P5**: Full RLS checks vs performance → always favor security
- **P6 vs P1**: Rich UX vs minimal code → balance with good defaults

## Decisions Made
- (To be filled during execution)

## Outcome
- (To be filled at completion)
