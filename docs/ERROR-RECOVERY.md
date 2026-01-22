# Error Recovery Playbook

> How to recover from stuck states, especially with external integrations.

---

## Xero Integration Failures

### Invoice Created Locally but Xero Rejects It
**Symptoms:** Local `invoices` row exists, but `xero_invoice_id` is NULL.

**Recovery:**
1. Check Xero API error in logs
2. Fix the payload issue (missing contact, invalid line items, etc.)
3. Retry invoice creation via admin action
4. If retries fail, delete local invoice row and start fresh

### Xero Invoice Exists but Local Record Lost
**Symptoms:** Invoice visible in Xero but not in CRM.

**Recovery:**
1. Run `syncXeroInvoices()` to pull all invoices
2. If still missing, manually create local record with `xero_invoice_id` set

### OAuth Token Expired
**Symptoms:** All Xero API calls return 401.

**Recovery:**
1. Go to Settings > Xero Connection
2. Click "Reconnect Xero"
3. Complete OAuth flow again

---

## Stripe Payment Failures

### Payment Received in Stripe but Not Recorded Locally
**Symptoms:** Stripe dashboard shows payment, CRM shows unpaid.

**Recovery:**
1. Check webhook logs for delivery failure
2. Manually trigger `markInvoicePaid(invoiceId, amount, date)`
3. This will write payment to both local DB and Xero

### Stripe Payment Recorded but Xero Write Failed
**Symptoms:** Local payment exists, but Xero still shows unpaid.

**Recovery:**
1. Check Xero API logs for error
2. Run `syncPaymentToXero(paymentId)` to retry
3. If Xero contact mismatch, fix `xero_contact_id` on client first

---

## Portal Token Issues

### Client Cannot Access Portal
**Symptoms:** Link returns 404 or "Invalid token".

**Recovery:**
1. Check if token exists in `client_portal_tokens`
2. Check if `revoked_at` is set (token was revoked)
3. If revoked, generate new token and send to client
4. If token missing, create new one via admin

### Multiple Tokens for Same Client User
**Symptoms:** Confusing access, old links still work.

**Recovery:**
1. Revoke all old tokens (`UPDATE ... SET revoked_at = now()`)
2. Generate single new token
3. Send new link to client

---

## Proposal/Contract Signing

### Signature Captured but SOW Not Created
**Symptoms:** `proposal_signatures` has record, `contract_docs` missing SOW.

**Recovery:**
1. Manually run `createSOWFromProposal(proposalId)`
2. This generates PDF and creates `contract_docs` entry

### Proposal Stuck in "Sent" Status
**Symptoms:** Client signed but status didn't update.

**Recovery:**
1. Check `proposal_signatures` for signature record
2. If exists, manually update proposal status to 'signed'
3. Trigger SOW creation if missing

---

## Database State Inconsistencies

### Lead Converted but Client/Project Missing
**Symptoms:** Lead has `converted_at` set but `client_id`/`project_id` NULL.

**Recovery:**
1. This indicates failed transaction
2. Create client and project manually
3. Update lead with correct IDs
4. Or: reset lead to unconverted state and retry

### Orphaned Records
**Symptoms:** Records reference deleted parents.

**Recovery:**
1. Run integrity check query (see below)
2. Delete orphaned records or reassign

```sql
-- Find orphaned invoices
SELECT * FROM invoices WHERE client_id NOT IN (SELECT id FROM clients);

-- Find orphaned proposals
SELECT * FROM proposals WHERE lead_id NOT IN (SELECT id FROM leads) AND lead_id IS NOT NULL;
```

---

## General Recovery Principles

1. **Check logs first** - Most failures have error messages
2. **Understand the state** - What exists vs what should exist
3. **Fix forward** - Retry the operation after fixing the root cause
4. **Don't delete blindly** - Preserve data for audit trail
5. **Test in staging** - If unsure, test recovery steps on staging first

---

*Add new recovery scenarios as they're discovered.*
