# Stage 5 Status - Xero Integration (Invoices + Payments)

## Current Task
- [ ] Verify preconditions (Stage 4 complete)
- [ ] Create database migration for invoices, payments, xero_settings
- [ ] Copy Xero integration files from jarve-website
- [ ] Copy Stripe integration files from jarve-website
- [ ] Implement Xero OAuth connection
- [ ] Implement invoice creation (Draft, GST exclusive)
- [ ] Implement invoice sync (status + PDF)
- [ ] Implement "Mark Paid" flow
- [ ] Implement Stripe webhook for payments
- [ ] Add invoices to global search
- [ ] Complete manual testing checklist

## Blockers
- **Stage 4 not complete** - Client Portal (chat + uploads + docs vault) not implemented
- **Stage 3 not complete** - Proposals & Contracts not implemented

## Preconditions
Per plan: Stage 4 complete (portal + docs vault)

## Scope
- Xero OAuth connection and tenant selection
- Create Draft invoices in Xero (GST 10%, tax exclusive)
- Sync invoice status and PDF to contract_docs
- Manual "Mark Paid" that writes payment to Xero
- Stripe webhook flow for payments
- Add invoices to global search

## Data Model (Pending)
Tables to create:
- `xero_settings` - tenant connection info
- `invoices` - invoice records with Xero sync
- `invoice_line_items` - line items per invoice
- `payments` - payment records

Column additions:
- `clients.xero_contact_id` - Xero contact mapping

## Files to Copy from jarve-website
- `lib/xero/client.ts`
- `app/actions/invoices/xero-sync.ts`
- `app/api/xero/connect/route.ts`
- `app/api/xero/callback/route.ts`
- `app/api/webhooks/xero/route.ts`
- `lib/stripe/client.ts`
- `app/api/webhooks/stripe/route.ts`

## Completed
(none yet)

## Files Changed
(none yet)

## Next Steps
1. Decide: proceed with Stage 5 or complete Stages 3-4 first
2. If proceeding: create database migration
3. Copy and adapt integration files

---
*Last updated: 2026-01-24*
