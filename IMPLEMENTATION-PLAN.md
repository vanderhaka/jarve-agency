# CRM Implementation Plan (Gated)

Start here: `docs/PLAN.md` (master index + stage files).

## Non-Negotiables
- TDD for data rules, state transitions, and external integrations.
- Manual test checklist per feature in `manual-tests/`.
- No new task starts until: all automated tests pass AND the manual checklist for that feature is signed off.
- Source of truth: portal chat for client comms; Xero for invoices/payments.
- Email is limited to one-off portal access link delivery.
- Reuse proven modules from `/Users/jamesvanderhaak/Desktop/Development/jarve-website` instead of re‑building.
- Use Vercel CLI for env management (no manual copy/paste of keys).
- Enforce RLS with role-based access (owner/admin/employee); employees see only assigned clients/projects; financials are owner-only.

### Clarified Decisions (Jan 2026)
| Area | Decision |
|------|----------|
| Architecture | Single-tenant (one agency owner) |
| Lead conversion | Link to existing client if email matches (case-insensitive) |
| Archived leads | Separate `archived_leads` table |
| Proposal versioning | New version row per change |
| SOW storage | Generated PDF + DB flag |
| MSA workflow | Template uploaded once, clients sign |
| Client users | Multiple users per client allowed |
| Chat scope | One thread per project |
| jarve-website reuse | Reference only, rewrite fresh |
| Xero contacts | Auto-create on first invoice |
| Invoice authorization | Manual "Authorize" button in CRM |
| Deposit invoice | % from agency settings, optional per-proposal override |
| Milestone completion | Both manual toggle AND auto from tasks |
| Notifications | Bell icon with dropdown |
| Scheduler | Vercel Cron (cost-effective) |
| Testing | TDD - tests first |

### Environment + Keys (Vercel CLI Only)
**Rule:** Use Vercel CLI to sync env vars (pull/add) — do not manually set keys in files.

**Required keys (match `jarve-website`):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `XERO_CLIENT_ID`
- `XERO_CLIENT_SECRET`
- `XERO_WEBHOOK_KEY`
- `XERO_REDIRECT_URI` (optional override)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Optional (only for portal access link email):**
- `RESEND_API_KEY`

---

## Access + Storage Defaults
- Portal access links are non-expiring; one active token per client user (regeneration revokes previous; revoked tokens retained for audit).
- Signed URL expiry: 1 hour (regenerate on each request).
- Clients can download docs/uploads; only admins can delete stored files.
- Portal access link email is sent when a proposal is sent (portal access is required to view/sign).

## Section-by-Section Audit (No Gaps)

### Reuse Map (From `jarve-website`)
**Goal:** Import working modules and adapt to this CRM’s data model (clients/projects/leads).

**Xero Integration (source of truth):**
- `lib/xero/client.ts`
- `app/actions/invoices/xero-sync.ts`
- `app/actions/invoices/invoice-documents.ts`
- `app/api/xero/connect/route.ts`
- `app/api/xero/callback/route.ts`
- `app/api/webhooks/xero/route.ts`
- `supabase/migrations/20251206000000_quote_invoices.sql` (structure reference)
- `supabase/migrations/20251207100000_xero_invoice_settings.sql`
- `supabase/migrations/20251207000000_add_xero_token_version.sql`

**Stripe Payments (match existing flow):**
- `lib/stripe/client.ts`
- `app/api/webhooks/stripe/route.ts`
- `__tests__/mocks/stripe.ts`
- `__tests__/integration/invoices/*`
- `types/invoices.ts`

**Client Portal (auth + tokens + manifest):**
- `app/actions/clientPortal.ts`
- `types/clientPortal.ts`
- `app/c/[token]/page.tsx`
- `app/api/portal-manifest/[token]/route.ts`
- `supabase/migrations/20251129000000_client_portal_tokens.sql`

**Quote/Portal Versioning (optional but useful):**
- `supabase/migrations/20251127010000_quote_portal_multi_version.sql`
- `types/quotePortal.ts`

**Required Adaptations in this CRM:**
- Portal tokens: never expire (`expires_at = NULL`) + one token per client user (not per contact).
- Xero invoice creation: **DRAFT** status and **Exclusive** tax mode (not AUTHORISED/Inclusive).
- Stripe webhook: after payment, write payment back to Xero and update local invoice.
- No email notifications (in‑app only) — skip Resend mailers.

### Platform Foundations (Solo Owner)
**Current:** Leads, clients, projects, tasks, global search, employee invites, profile settings exist.

**Data flow:**
- Agency settings → default currency, GST, deposit %, timesheet lock schedule → used by proposals, milestones, invoices.
- Search → indexes entities across CRM. (Expand as new entities are added.)

**Gaps / fixes:**
- Agency settings table doesn’t exist yet.
- Search only covers leads/clients/projects today; add new entity types when they exist.
- Implement a `search_index` table with triggers and `tsvector` for unified, fast, RLS-safe search.

**Tests:**
- Automated: validate settings defaults; search query escape.
- Manual: `manual-tests/agency-settings.md` + `manual-tests/search.md`.

---

### Pipeline & Sales (Leads → Proposal → Contract → Project)
**Current:** Leads list + kanban, lead detail, interaction timeline.

**Data flow:**
- Lead created → status moves (new/contacted/converted) → proposal created → signed → lead archived → client + project created.
- Signed proposal becomes SOW (contract doc) → stored in Docs Vault.
- MSA stored per client (signed once).
 - Project cannot move to Active until MSA + SOW are signed.

**Gaps / fixes:**
- No lead→project conversion flow.
- ✅ Lead tasks dialog removed (Stage 0) — used columns not in `tasks` table.
- Proposal/contract data model not implemented.
- ✅ Interaction timeline renamed to "Internal Notes" (Stage 0) — client comms live in portal chat.
- Lead conversion requires lead name + email; match existing client by exact email (case-insensitive) only.
- Project defaults on conversion: `status=planning`, `type=web`, `assigned_to` optional.
- 🔲 Kanban drag-drop broken (Stage 0) — state sync issue.
- 🔲 New lead doesn't auto-appear (Stage 0) — needs Realtime subscriptions.
- 🔲 External lead submission blocked (Stage 0) — RLS blocks anon inserts, need API route.
- Archived leads are hidden by default; archive view uses a dedicated toggle/filter/search.

**Tests:**
- Automated: lead conversion creates client + project + archives lead; proposal signing locks version.
- Manual: `manual-tests/lead-to-project.md`, `manual-tests/proposals-contracts.md`.

---

### Financial Management (Xero-Backed)
**Current:** No invoices/payments in app; Xero is intended source of truth.

**Data flow:**
- Proposal signed → draft deposit invoice created in Xero (uses proposal total, via milestone system).
- Milestone completion or approved change request → create invoice in Xero → store `xero_invoice_id` locally → sync status + PDF → show in Docs Vault.
- Payments recorded in Xero → sync into CRM → update client balance + reminders.
- Invoices are created in Draft by default.
- Due date defaults to invoice issue date (due on invoice) unless overridden.
- Manual “Mark Paid” writes payment back to Xero.
- Stripe checkout (from `jarve-website`) records payments and posts them into Xero.

**Gaps / fixes:**
- Xero OAuth + tenant connection not implemented.
- Client records need `xero_contact_id` mapping.
- Invoice status sync + PDF storage needed.
- Manual “Mark Paid” for bank transfer required.
- Stripe webhook + payment flow must be ported to match existing implementation.
- Xero tax rate: use "GST on Income" (exclusive).
- Support creating/updating Xero contacts directly from the CRM.
- "Mark Paid" bank account: auto-select first active bank account in Xero.

**Tests:**
- Automated: Xero API client + webhook/polling sync (mocked), invoice creation from milestone.
- Manual: `manual-tests/xero-invoicing-payments.md`.

---

### Project Management (Tasks + Milestones)
**Current:** Project task board (kanban/list) implemented and working.

**Data flow:**
- Project tasks tracked → progress + overdue counts → reminders.
- Milestones define deliverables → completion → auto invoice in Xero.

**Gaps / fixes:**
- Lead tasks dialog references non-existent columns (remove or migrate).
- Milestones not implemented.
- Deposit invoice should be created after proposal is signed (uses proposal total) once milestones exist.

**Tests:**
- Automated: task move updates status/position; milestone completion triggers invoice create.
- Manual: `manual-tests/project-tasks.md`, `manual-tests/milestones.md`.

---

### Change Requests (Scope Control)
**Data flow:**
- Client requests change → you estimate impact → client signs → new milestone inserted → Xero invoice created.

**Gaps / fixes:**
- Change request model + portal signature flow not implemented.

**Tests:**
- Automated: change request approval creates milestone + invoice payload.
- Manual: `manual-tests/change-requests.md`.

---

### Client Portal (Access + Docs + Chat)
**Data flow:**
- Client user invited → receives non-expiring access link (emailed) → portal session created.
- Portal shows Docs Vault (contracts/invoices/proposals) + chat thread per project + uploads.

**Gaps / fixes:**
- Portal auth + client user model missing.
- Docs Vault separation (contract docs vs project docs).
- Chat system + webhook notifications missing.
- Client uploads with virus scan + notifications missing.
- Portal token logic must be adapted from `jarve-website` (per client user, non‑expiring).
- Uploads: allow pdf/docx/jpg/png; 50MB max; no virus scan for MVP.
- Portal read state table required for unread badges.
- New chat message notifications are internal-only (no external webhook).

**Tests:**
- Automated: magic-link auth, session creation, access revocation.
- Manual: `manual-tests/client-portal.md`.

---

### Time Tracking (Contractors Only)
**Data flow:**
- Contractor logs time → weekly lock schedule in settings → entries become read-only.
- Time entries feed cost/profitability reports (optional now).

**Gaps / fixes:**
- Time entry + timesheet tables not implemented.
- Weekly lock job needed.

**Tests:**
- Automated: lock job prevents edits after cutoff; required description.
- Manual: `manual-tests/time-tracking.md`.

---

### Notifications & Reminders (In-App Only)
**Data flow:**
- Date-based triggers (tasks, milestones, invoices, proposals, change requests) → in-app notifications → activity feed.

**Status:** ✅ Implemented (Stage 7)
- Notifications table with RLS policies
- Bell icon UI with dropdown (mark as read, navigation)
- Cron scheduler for overdue detection
- Immediate triggers for signed documents and payments

**Tests:**
- Automated: scheduler generates correct reminders with status checks. ✅ 32 tests
- Manual: `manual-tests/stage-7-notifications.md`.

---

### Reporting & Analytics
**Data flow:**
- Leads in (new leads created) + leads converted + tasks remaining → KPI dashboard.
- Financials pulled from Xero sync.

**Gaps / fixes:**
- KPI dashboard not implemented.

**Tests:**
- Automated: KPI calculations (unit tests).
- Manual: add checklist once dashboard exists.

---

## Execution Stages (Hard Gates)

### Stage 0 — Foundation Fixes (Expanded)
**Scope:**
- ✅ Remove lead tasks dialog (referenced non-existent columns)
- ✅ Rename interactions to "Internal Notes" (client comms via portal only)
- 🔲 Fix kanban drag-and-drop (state sync issue between page and component)
- 🔲 Fix new lead auto-refresh (add Supabase Realtime subscriptions)
- 🔲 Enable external lead submission (API route for website integration)

**DoD:** All Stage 0 tests pass + `manual-tests/leads-pipeline.md` signed off (including drag-drop, auto-refresh, and external submission tests).

### Stage 1 — Lead → Project Conversion
**Scope:** Archive lead, create client + project, proposal links, activity log.
**DoD:** Automated conversion tests pass + `manual-tests/lead-to-project.md`.

### Stage 2 — Platform Foundations (Agency Settings)
**Scope:** Agency settings table + UI, default deposit/GST/currency/terms (text + optional days), timesheet lock schedule, reminder schedule settings.
**DoD:** Settings tests pass + `manual-tests/agency-settings.md` and `manual-tests/search.md`.

### Stage 3 — Proposals + Contracts (MSA/SOW)
**Scope:** Proposal builder, versioning, signing in portal, docs vault storage.
**DoD:** Proposal signing tests pass + `manual-tests/proposals-contracts.md`.

### Stage 4 — Client Portal (Chat + Uploads + Docs Vault)
**Scope:** Client users + access links (from `jarve-website`), portal manifest route, docs vault UI, chat per project, uploads.
**DoD:** Portal auth tests pass + `manual-tests/client-portal.md`.

### Stage 5 — Xero Integration (Invoices + Payments)
**Scope:** OAuth, contact sync, invoice create (Draft), status sync, PDF fetch, manual mark paid, Stripe webhook/payment flow (from `jarve-website`).
**DoD:** Xero integration tests pass + `manual-tests/xero-invoicing-payments.md`.

### Stage 6 — Milestones + Change Requests
**Scope:** Milestones, auto-create draft deposit invoice after proposal signing (uses proposal total), auto invoice trigger, change request signing + milestone insertion.
**DoD:** Milestone + change request tests pass + `manual-tests/milestones.md` and `manual-tests/change-requests.md`.

### Stage 7 — Reminders & Notifications (In-App) ✅
**Scope:** Notifications table, scheduler + notification UI for tasks/milestones/invoices/proposals/change requests.
**DoD:** Reminder tests pass + `manual-tests/reminders.md`.

**Completed (Jan 2026):**
- ✅ Notifications table with RLS policies + unique index
- ✅ Bell icon UI with popover dropdown
- ✅ Cron endpoint (`/api/cron/reminders`) secured with CRON_SECRET
- ✅ Immediate triggers for proposal/CR signed, invoice paid
- ✅ 32 automated tests passing
- ✅ Manual test checklist: `manual-tests/stage-7-notifications.md`

**Fixes during testing:**
- Changed `owner_id` → `created_by` in scheduler (column doesn't exist)
- Removed `deleted_at` filter (column doesn't exist in tasks table)
- Fixed PostgREST filter syntax for milestone status exclusion

> **Note:** Time Tracking (Contractors) moved to FUTURE-IDEAS.md - implement when you hire contractors.

---

## Gate Policy (Must Pass)
A stage is complete only when:
- All automated tests pass (`npm test`).
- Manual test checklist for that feature is completed and dated.
- You confirm acceptance before moving on.
