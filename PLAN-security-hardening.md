# Ensemble Execution Plan

**Status**: Planning
**Complexity**: 55/100 (Medium-High)
**Agents**: 9 (P1-P9)
**Started**: 2026-01-29
**Updated**: 2026-01-29

---

## Questions & Clarifications

> **BLOCKING**: Execution cannot proceed until these are answered.

Resolved:
1. **Non-employee auth users?** → Employees only. Clients use portal tokens. `authenticated` RLS = employees, so `USING (true)` for `authenticated` role is acceptable.
2. **Project-level ACL between employees?** → No, all employees see all projects.
3. **Portal security migrations applied to prod?** → Not sure. Will verify via Supabase MCP before dropping policies.

---

## Objective

Harden the jarve-agency application against unauthenticated admin access, form spam, bot abuse, spoofable cron endpoints, dangerous RLS policies, and missing security headers before going live.

## Analysis

The audit found 8 critical and 5 high severity issues. The app has good fundamentals (service_role separation, Stripe webhook verification, gitignored .env) but is missing defense-in-depth: middleware doesn't protect `/admin/*`, admin API routes have zero auth, the contact form has no spam protection, cron endpoints trust a spoofable header, anon RLS policies expose invoice data, and there are no security headers. Complexity is medium-high due to the breadth of changes across middleware, API routes, forms, config, and database policies - but each individual fix is straightforward.

---

## Agent Type: security-auditor

## Base Task

Implement 15 security hardening measures: middleware fix, admin API auth + employee role gate, settings auth, cron auth fix, RLS policy cleanup, rate limiting, honeypot, security headers, robots.txt, Next.js CVE patch, portal messages project-level auth, portal token expiry, upload userId verification, and lead email HTML sanitization.

---

## Tasks

- [x] Phase 0: Research (gather context)
- [x] Phase 0.5: Clarify (answer questions) - No blocking questions
- [x] Phase 1: Plan (this document)
- [ ] Phase 2: Execute (9 agents with perspectives)
- [ ] Phase 3: Review (synthesize outputs)
- [ ] Phase 4: Validate (tests, types, lint)
- [ ] Phase 5: Deliver (present result)

### Implementation Tasks (Micro-Steps)

---

### Step 1.1: Fix middleware to protect `/admin/*` routes
- **passes**: false
- **criteria**:
  - test: `grep -q "startsWith('/admin')" utils/supabase/middleware.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Unauthenticated requests to /admin/* are redirected to /login"
- **evidence**: []
- **attempts**: 0

---

### Step 1.2: Add auth + employee role gate to admin PDF regeneration API
- **passes**: false
- **criteria**:
  - test: `grep -q "requireEmployee\|getUser" app/api/admin/regenerate-pdfs/route.ts` → "match found"
  - test: `grep -q "401" app/api/admin/regenerate-pdfs/route.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Unauthenticated POST returns 401; non-employee returns 403"
- **evidence**: []
- **attempts**: 0

---

### Step 1.2b: Add employee role gate to regenerate-pdf action
- **passes**: false
- **criteria**:
  - test: `grep -q "requireEmployee\|getUser\|employee" app/actions/contract-docs/regenerate-pdf.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "regenerateAllPendingPdfs checks caller is an employee/admin before executing"
- **evidence**: []
- **attempts**: 0

---

### Step 1.3: Add admin role check to settings actions
- **passes**: false
- **criteria**:
  - test: `grep -q "getUser\|requireEmployee\|auth" app/admin/settings/actions.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Both getAgencySettings and updateAgencySettings verify authenticated employee"
- **evidence**: []
- **attempts**: 0

---

### Step 2.1: Fix cron auth - don't trust x-vercel-cron alone
- **passes**: false
- **criteria**:
  - test: `grep -c "return true" app/api/cron/reminders/route.ts` → "0" (no early return for header)
  - test: `grep -c "return true" app/api/cron/stripe-reconcile/route.ts` → "0"
  - principle: "CRON_SECRET Bearer token is always required, x-vercel-cron is supplementary only"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: []

---

### Step 3.1: Drop dangerous anon RLS policies via migration
- **passes**: false
- **criteria**:
  - test: Supabase MCP query `SELECT policyname FROM pg_policies WHERE policyname LIKE 'Anon can view%'` → "0 rows"
  - principle: "Portal access still works via service_role client with token validation"
- **evidence**: []
- **attempts**: 0

---

### Step 4.1: Create in-memory rate limiter
- **passes**: false
- **criteria**:
  - test: `test -f lib/rate-limit.ts` → "exists"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Exports a function that limits by IP, returns 429 when exceeded"
- **evidence**: []
- **attempts**: 0

---

### Step 4.2: Apply rate limiting to leads API
- **passes**: false
- **criteria**:
  - test: `grep -q "rate" app/api/leads/route.ts` → "match found"
  - test: `grep -q "429" app/api/leads/route.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0
- **blocked_by**: ["4.1"]

---

### Step 5.1: Add honeypot to contact form + API
- **passes**: false
- **criteria**:
  - test: `grep -q "website" components/contact-form.tsx` → "match found" (honeypot field)
  - test: `grep -q "website" app/api/leads/route.ts` → "match found" (honeypot check)
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Honeypot field is visually hidden, bots filling it get silently rejected"
- **evidence**: []
- **attempts**: 0

---

### Step 6.1: Add security headers to next.config.ts
- **passes**: false
- **criteria**:
  - test: `grep -q "X-Frame-Options" next.config.ts` → "match found"
  - test: `grep -q "X-Content-Type-Options" next.config.ts` → "match found"
  - test: `grep -q "Strict-Transport-Security" next.config.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0

---

### Step 7.1: Create robots.ts
- **passes**: false
- **criteria**:
  - test: `test -f app/robots.ts` → "exists"
  - test: `grep -q "/admin/" app/robots.ts` → "match found"
  - test: `grep -q "/api/" app/robots.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
- **evidence**: []
- **attempts**: 0

---

### Step 8.1: Upgrade Next.js to fix CVE
- **passes**: false
- **criteria**:
  - test: `npm audit --json 2>/dev/null | grep -c '"high"'` → "0"
  - principle: "Next.js version >= 16.1.5"
- **evidence**: []
- **attempts**: 0

---

### Step 9.1: Add project-level auth check to portal messages
- **passes**: false
- **criteria**:
  - test: `grep -q "project\|authorized\|employee" lib/integrations/portal/actions/messages.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Portal message read/write verifies the caller is an authenticated employee before service_role access"
- **evidence**: []
- **attempts**: 0

---

### Step 9.2: Sanitize lead notification email HTML
- **passes**: false
- **criteria**:
  - test: `grep -q "escape\|sanitize\|encode\|textContent\|replace" app/api/leads/route.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "User-supplied name/email/message are HTML-escaped before interpolation into email template"
- **evidence**: []
- **attempts**: 0

---

### Step 9.3: Verify portal security migrations applied
- **passes**: false
- **criteria**:
  - test: Supabase MCP query `SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '20260128100000%' OR version LIKE '20260128120000%'` → "2 rows"
  - principle: "Both fix_portal_security and harden_portal_signing_rls migrations are live"
- **evidence**: []
- **attempts**: 0

---

### Step 9.4: Server-verify userId on admin uploads
- **passes**: false
- **criteria**:
  - test: `grep -q "getUser\|auth\|session" app/admin/projects/\[id\]/tabs/uploads/actions.ts` → "match found"
  - type: `npx tsc --noEmit` → "No errors"
  - principle: "Upload action uses server-side session user ID, not client-supplied userId"
- **evidence**: []
- **attempts**: 0

---

## Files to Modify
- `utils/supabase/middleware.ts` - Add /admin to protected routes
- `app/api/admin/regenerate-pdfs/route.ts` - Add authentication + employee role check
- `app/actions/contract-docs/regenerate-pdf.ts` - Add employee role gate
- `app/admin/settings/actions.ts` - Add employee auth check
- `app/api/cron/reminders/route.ts` - Fix verifyCronSecret
- `app/api/cron/stripe-reconcile/route.ts` - Fix verifyCronSecret
- `lib/rate-limit.ts` - NEW: in-memory rate limiter
- `app/api/leads/route.ts` - Add rate limiting + honeypot check + HTML sanitization
- `components/contact-form.tsx` - Add honeypot field
- `next.config.ts` - Add security headers
- `app/robots.ts` - NEW: robots configuration
- `package.json` - Next.js version upgrade
- `lib/integrations/portal/actions/messages.ts` - Add employee auth verification
- `app/admin/projects/[id]/tabs/uploads/actions.ts` - Server-verify userId

---

## Perspective Prompts

### P1: SIMPLICITY
**Prompt**: "Implement security hardening - Focus on SIMPLICITY: Use the minimum code needed for each fix. Prefer built-in Next.js/Supabase features over custom solutions. No external dependencies for rate limiting."
**Goal**: Clean, minimal implementations

### P2: ROBUSTNESS
**Prompt**: "Implement security hardening - Focus on ROBUSTNESS: Ensure every auth check handles edge cases (missing env vars, expired sessions, malformed requests). Never fail open."
**Goal**: Bulletproof error handling

### P3: PERFORMANCE
**Prompt**: "Implement security hardening - Focus on PERFORMANCE: Rate limiter must be O(1), security headers should be static, middleware checks should short-circuit early."
**Goal**: Zero performance regression

### P4: SECURITY
**Prompt**: "Implement security hardening - Focus on SECURITY: Defense in depth on every layer. Validate at middleware AND route level. Never trust client headers. Silent rejection for honeypot."
**Goal**: No bypasses possible

### P5: MAINTAINABILITY
**Prompt**: "Implement security hardening - Focus on MAINTAINABILITY: Reusable auth helpers, single source of truth for security config, clear comments explaining why each measure exists."
**Goal**: Easy to maintain and extend

### P6: TESTABILITY
**Prompt**: "Implement security hardening - Focus on TESTABILITY: Each security measure should be independently verifiable via curl or browser. Rate limiter should be resettable for testing."
**Goal**: Verifiable security measures

### P7: SCALABILITY
**Prompt**: "Implement security hardening - Focus on SCALABILITY: In-memory rate limiter works for single-instance Vercel but document path to Upstash/Redis. Headers config should scale to many routes."
**Goal**: Clear upgrade path

### P8: USABILITY
**Prompt**: "Implement security hardening - Focus on USABILITY: Honeypot must be invisible to real users. Rate limit messages should be helpful. Security measures must not break legitimate user flows."
**Goal**: Invisible to legitimate users

### P9: COMPATIBILITY
**Prompt**: "Implement security hardening - Focus on COMPATIBILITY: Ensure security headers don't break embedded iframes, Stripe checkout, Supabase realtime, or Resend email sending."
**Goal**: No breaking changes

---

## Integration Notes
- Steps 1.x (auth fixes) are independent and can run in parallel
- Step 3.1 (RLS) is independent - use Supabase MCP
- Steps 4.x (rate limiting) are sequential
- Steps 5-8 are independent of each other

## Expected Conflicts
- P4 (Security) may want strict CSP but P9 (Compatibility) will flag it breaks Stripe/Supabase - defer CSP to post-launch
- P1 (Simplicity) prefers in-memory rate limiter, P7 (Scalability) wants Redis - use in-memory now with upgrade path documented

## Decisions Made
- In-memory rate limiter (no external deps) for launch; upgrade to Upstash post-launch
- Cloudflare Turnstile deferred (requires account setup)
- CSP header deferred (needs careful testing with Stripe/Supabase)

## Outcome
[Filled at completion]
