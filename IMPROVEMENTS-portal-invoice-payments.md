# Improvements: Portal Invoice Payments
Date: 2026-01-28

## Security / Access
- Replace anon SELECT policies with scoped RLS tied to portal tokens, or run portal invoice queries with the service role to avoid public invoice access.
- Validate Stripe checkout sessions against the portal token/client before showing payment details on the success page.
- Block draft invoices server-side in checkout creation.

## Data Integrity
- Hide Pay Now when amountDue <= 0 and treat the invoice as paid in both UI and API paths.
- Persist checkout session IDs and paid_at updates with elevated privileges, or surface/handle RLS failures explicitly.
- Decide how to treat fully paid invoices when paid_at is null (consider a DB trigger to set paid_at when payments sum to total).

## UX
- Support `?tab=invoices` deep links, or update success/cancel CTAs to open the invoices tab directly.
- Ensure the success page can display the invoice number (add metadata or fetch invoice details by invoice_id).

## Testing
- Add portal invoice flow coverage for draft, partial, paid, and overpaid invoices.
- Add a regression test to ensure anon API access cannot read invoices directly.
