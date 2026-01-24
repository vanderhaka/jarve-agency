# Stage 5 Status - Xero Integration (Invoices + Payments)

## Current Task
- [x] Create database migration for invoices, payments, xero_connections
- [x] Xero integration files (already copied in Stage 2)
- [x] Stripe integration files (already copied in Stage 2)
- [x] Implement Xero OAuth connection
- [x] Implement invoice creation (Draft, GST exclusive)
- [x] Implement invoice sync (status)
- [x] Implement "Mark Paid" flow
- [x] Implement Stripe webhook for payments
- [x] Add Xero Connection UI in settings
- [x] Add invoices to global search
- [ ] Apply migration to Supabase
- [ ] Complete manual testing checklist

## Blockers
- **Stage 3/4 in parallel** - Being built concurrently, `contract_docs` table added as stub

## Preconditions
Per plan: Stage 4 complete (portal + docs vault) - proceeding in parallel

## Scope
- Xero OAuth connection and tenant selection
- Create Draft invoices in Xero (GST 10%, tax exclusive)
- Sync invoice status to local database
- Manual "Mark Paid" that writes payment to Xero
- Stripe webhook flow for payments
- Add invoices to global search

## Data Model (Created)
Tables created in migration:
- `xero_connections` - OAuth tokens and tenant info
- `invoices` - invoice records with Xero sync
- `invoice_line_items` - line items per invoice
- `payments` - payment records
- `contract_docs` - stub for Stage 3 (will store invoice PDFs)

Column additions:
- `clients.xero_contact_id` - Xero contact mapping

## Completed
- [x] Database migration created
  - `supabase/migrations/20260124000001_stage_5_xero_stripe.sql`
  - Tables: xero_connections, invoices, invoice_line_items, payments, contract_docs
  - RLS policies for all tables
  - Indexes for lookups
  - Triggers for updated_at
- [x] Xero OAuth routes
  - `/api/xero/connect` - initiates OAuth flow
  - `/api/xero/callback` - handles OAuth callback
  - `/api/xero/disconnect` - disconnects Xero
- [x] Stripe webhook
  - `/api/webhooks/stripe` - handles payment events
  - Posts payments back to Xero automatically
- [x] Invoice server actions
  - `createInvoice` - creates local invoice + syncs to Xero
  - `syncInvoiceToXero` - syncs invoice to Xero as Draft
  - `syncInvoiceStatus` - pulls status from Xero
  - `getProjectInvoices` - list invoices for project
  - `getAllInvoices` - list all invoices (admin)
  - `markInvoicePaid` - manual payment recording
- [x] Xero Connection UI
  - `XeroConnectionCard` component added to settings
  - Shows connection status, tenant name
  - Connect/disconnect buttons
- [x] Global search updated
  - Invoices searchable by invoice number

## Files Created
- `supabase/migrations/20260124000001_stage_5_xero_stripe.sql`
- `app/api/xero/connect/route.ts`
- `app/api/xero/callback/route.ts`
- `app/api/xero/disconnect/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/actions/invoices/actions.ts`
- `components/xero-connection-card.tsx`

## Files Modified
- `app/admin/settings/page.tsx` - added XeroConnectionCard
- `app/api/search/route.ts` - added invoices to search

## Pre-existing Files (from Stage 2)
- `lib/integrations/xero/client.ts` - Xero API client
- `lib/integrations/stripe/client.ts` - Stripe client

## Next Steps
1. Apply migration to Supabase Dashboard
2. Set environment variables (XERO_CLIENT_ID, XERO_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
3. Run manual testing checklist
4. Sign off stage

## Testing Notes
- Xero OAuth requires valid XERO_CLIENT_ID and XERO_CLIENT_SECRET
- Stripe webhook requires STRIPE_WEBHOOK_SECRET for signature verification
- For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---
*Last updated: 2026-01-24*
