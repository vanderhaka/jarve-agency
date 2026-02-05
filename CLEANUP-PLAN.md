# Codebase Cleanup Plan — Remaining Items

> Generated 2026-02-05 after four rounds of cleanup.
> Items are grouped by category and sorted by risk (low → high).

---

## Completed (Rounds 1–4)

- Removed dead v1 landing page + 11 v1-only components (−1299 lines)
- Removed 3 unused setup scripts (confirm_user, create_admin, create_employee)
- Removed deprecated task-kanban.tsx re-export bridge
- Fixed insecure `Math.random()` token generation → `crypto.randomBytes()` (3 files)
- Consolidated `generatePortalToken` into `lib/crypto.ts` (was in 4 places)
- Fixed silent `.catch(() => {})` error swallowing (5 files)
- Removed 25 debug `console.log` statements
- Fixed `any` type in settings/actions.ts
- Added missing `import type` in use-proposal-form.ts
- Fixed N+1 query in link-health.ts
- Removed unnecessary export on `fetchGSCData`
- Refactored seo-dashboard/page.tsx (722 → 148 lines, 7 extracted modules)
- Refactored profile-dashboard.tsx (552 → 133 lines, 5 extracted modules)
- Removed 14 stale Stage/TODO comments across 12 files
- Removed 20 debug `console.log` statements (portal messages, manifest, versioning, signing, invoices)
- Audited ESLint disable comments (14/16 are legitimate `exhaustive-deps`, 2 are necessary library workarounds)
- Moved `lib/seo/components.tsx` to `components/seo/components.tsx` (lib/ layer violation fixed)

---

## Remaining — Low Risk

### 1. ESLint Disable Comments (16)

14 are `react-hooks/exhaustive-deps` for data fetch on mount — legitimate pattern.
1 is `@typescript-eslint/no-require-imports` in tailwind.config.ts — necessary.
1 is `@typescript-eslint/no-explicit-any` in sow-pdf-generator.ts — library limitation.

**Action:** Could fix the `exhaustive-deps` ones by wrapping fetch functions in `useCallback`, but this is a large refactor for minimal benefit. Keep as-is.

### 2. Double-Quote Inconsistencies

The codebase mostly uses single quotes. A few files still use double quotes for string literals.

**Action:** Low priority. Will be caught naturally by a formatter if one is added.

---

## Remaining — Medium Risk

### 3. Unsafe Type Assertions (~11)

| Pattern | Files | Risk |
|---------|-------|------|
| `as unknown as X` | portal actions, xero sync | Type laundering — hides real mismatches |
| `as any` | various | Disables type checking |
| `as Record<string, unknown>` | seo content parsing | Reasonable for JSON blobs |

Key locations:
- `app/portal/[token]/*/actions.ts` — Supabase query results cast
- `lib/integrations/xero/` — External API response types
- `lib/seo/link-health.ts` — JSON content field

**Action:** Define proper interfaces for Supabase row types and external API responses. The `Record<string, unknown>` casts for JSON content columns are acceptable.

### 4. Remaining `Math.random()` Usage (3 instances)

| File | Usage | Risk |
|------|-------|------|
| `lib/seo/generation.ts` | Content variation seed | Low — not security-sensitive |
| `components/terra-flow/booking-modal.tsx` | Mock booking ID | Low — demo UI only |
| Test file | Test data generation | None — test-only |

**Action:** The generation.ts usage could use `crypto.randomInt()` for consistency but is not a security issue. The others are fine as-is.

### 5. Deprecated Annotation Wrappers (~5)

`withClientTracking`, `withErrorBoundary`, or similar wrappers that may no longer serve a purpose in the current architecture.

**Action:** Trace usage and remove if no longer needed. Verify there are no runtime side effects before removing.

### 6. "playwriter" in Script Names

Scripts `playwriter-admin-smoke.mjs` and `playwriter-list-tools.mjs` reference `playwriter@latest` npm package. May be intentional package name (MCP Playwright wrapper) — verify before renaming.

**Action:** Check if `playwriter` is the actual npm package name. If it's a typo for `playwright`, rename files and update content.

---

## Remaining — Higher Risk

### 7. Large Functions (300+ lines)

| File | Function/Section | Lines | Notes |
|------|------------------|-------|-------|
| `app/portal/[token]/invoices/actions.ts` | Multiple server actions | ~547 | Well-structured but long; could split into sub-modules |
| `lib/seo/generation.ts` | pSEO generation logic | ~400+ | Complex generation pipeline |
| `lib/integrations/xero/sync.ts` | Xero sync pipeline | ~300+ | External API orchestration |
| `app/admin/sidebar.tsx` | Compound component | 726 | Actually well-structured — low priority |

**Action:** Split only if testability or readability would clearly improve. These are integration-heavy files where splitting may just move complexity around.

---

## Not Recommended

These were considered but are not worth the risk/effort:

- **Normalizing v2- prefix on landing page components** — Works fine, purely cosmetic
- **Adding Prettier** — Would generate massive diff across the repo with no functional benefit
- **Refactoring sidebar.tsx** — Already a well-structured compound component at 726 lines
- **Replacing all `as` assertions** — Some are necessary for Supabase/external API typing

---

## Prioritized Execution Order

If continuing cleanup, tackle in this order:

1. Unsafe type assertions (item 3) — medium risk, best done per-module
2. Deprecated wrappers audit (item 5) — medium risk, needs usage tracing
3. Large function splits (item 7) — higher risk, do only where clearly beneficial
