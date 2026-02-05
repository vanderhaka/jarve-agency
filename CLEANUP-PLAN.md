# Codebase Cleanup Plan — Remaining Items

> Generated 2026-02-05 after three rounds of cleanup.
> Items are grouped by category and sorted by risk (low → high).

---

## Completed (Rounds 1–3)

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

---

## Remaining — Low Risk

### 1. Remaining `console.log` Statements (~20)

Production logging that should be reviewed — some are intentional, some are debug leftovers.

| File | Count | Notes |
|------|-------|-------|
| `app/portal/[token]/messages/actions.ts` | ~3 | Portal message operations |
| `app/api/cron/sync-xero-invoices/route.ts` | ~3 | Cron job logging |
| `app/api/cron/check-overdue-invoices/route.ts` | ~2 | Cron job logging |
| `app/api/cron/send-scheduled-emails/route.ts` | ~2 | Cron job logging |
| `app/admin/proposals/[id]/hooks/use-proposal-signing.ts` | ~4 | Signing flow |
| `app/admin/proposals/[id]/hooks/use-proposal-versioning.ts` | ~3 | Versioning flow |
| `lib/integrations/portal/client.ts` | ~3 | Portal client ops |

**Action:** Replace with structured logger or remove. Cron job logs may be intentional — verify before removing.

### 2. Stale TODO/Stage Comments (~6)

References to "Stage 5" or outdated planning milestones scattered in:
- `lib/seo/` files
- `app/admin/seo-dashboard/` files

**Action:** Remove or update to reflect current status.

### 3. ESLint Disable Comments (~16)

Most are `@typescript-eslint/no-explicit-any` suppressions. Review each:
- Some guard genuinely untyped external data (Supabase JSON columns) — keep
- Some are lazy shortcuts — replace with proper types

**Action:** Audit one-by-one. Remove suppressions where a concrete type is feasible.

### 4. Double-Quote Inconsistencies

The codebase mostly uses single quotes. A few files still use double quotes for string literals.

**Action:** Low priority. Will be caught naturally by a formatter if one is added.

---

## Remaining — Medium Risk

### 5. Unsafe Type Assertions (~11)

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

### 6. Remaining `Math.random()` Usage (3 instances)

| File | Usage | Risk |
|------|-------|------|
| `lib/seo/generation.ts` | Content variation seed | Low — not security-sensitive |
| `components/terra-flow/booking-modal.tsx` | Mock booking ID | Low — demo UI only |
| Test file | Test data generation | None — test-only |

**Action:** The generation.ts usage could use `crypto.randomInt()` for consistency but is not a security issue. The others are fine as-is.

### 7. Deprecated Annotation Wrappers (~5)

`withClientTracking`, `withErrorBoundary`, or similar wrappers that may no longer serve a purpose in the current architecture.

**Action:** Trace usage and remove if no longer needed. Verify there are no runtime side effects before removing.

---

## Remaining — Higher Risk

### 8. Large Functions (300+ lines)

| File | Function/Section | Lines | Notes |
|------|------------------|-------|-------|
| `app/portal/[token]/invoices/actions.ts` | Multiple server actions | ~547 | Well-structured but long; could split into sub-modules |
| `lib/seo/generation.ts` | pSEO generation logic | ~400+ | Complex generation pipeline |
| `lib/integrations/xero/sync.ts` | Xero sync pipeline | ~300+ | External API orchestration |
| `app/admin/sidebar.tsx` | Compound component | 726 | Actually well-structured — low priority |

**Action:** Split only if testability or readability would clearly improve. These are integration-heavy files where splitting may just move complexity around.

### 9. Architecture: UI Import in `lib/` Layer

`lib/seo/components.tsx` imports `lucide-react` icons, which violates the convention that `lib/` contains business logic only (no UI dependencies).

**Action:** Move to `components/seo/` or `app/admin/seo-dashboard/components/`. Requires updating all importers.

### 10. "playwriter" Typo in Script Names

Playwright-related scripts are misspelled as "playwriter" in filenames and content.

**Action:** Rename files and update references. Low impact but looks unprofessional.

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

1. Stale TODO comments (item 2) — trivial, no risk
2. Console.log audit (item 1) — low risk, improves production logs
3. ESLint disable audit (item 3) — low risk, improves type safety
4. Unsafe type assertions (item 5) — medium risk, best done per-module
5. UI import in lib/ (item 9) — medium risk, clear architectural win
6. Large function splits (item 8) — higher risk, do only where clearly beneficial
