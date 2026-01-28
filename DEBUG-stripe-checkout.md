# Stripe Checkout Debug Session

**Date:** 2026-01-28
**Status:** IN PROGRESS - Still getting 400 errors

---

## Problem Summary

When clicking "Pay Now" on an invoice in the client portal, the Stripe Checkout session creation fails with a 400 Bad Request error.

**Error Messages Seen:**
1. "An error occurred with our connection to Stripe. Request was retried 2 times."
2. "not valid URL"

---

## Environment

- **Production URL:** https://jarve.com.au (also https://www.jarve.com.au)
- **Vercel Project:** jarve-agency
- **Stripe Mode:** Live (sk_live_...)

---

## What We've Done

### 1. Updated Stripe API Key
- User provided new Stripe live key
- Updated `.env.local` locally
- Updated Vercel production environment variable via CLI
- Redeployed to production

### 2. Verified Deployment
- Deployment ID: `dpl_Diw7XZdy7BBTjW1vABeS5Ruzysma`
- Status: READY
- Aliases: www.jarve.com.au, jarve.com.au, jarve-agency.vercel.app

### 3. Environment Variables in Vercel
```
STRIPE_SECRET_KEY        - Updated just now
STRIPE_WEBHOOK_SECRET    - Set 1d ago
NEXT_PUBLIC_SITE_URL     - Set 25m ago (https://jarve.com.au)
```

---

## Code Flow

### 1. Frontend (`app/portal/[token]/components/invoice-detail-modal.tsx`)
```typescript
// Calls API endpoint
const response = await fetch('/api/portal/invoices/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, invoiceId: invoice.id }),
})
```

### 2. API Route (`app/api/portal/invoices/checkout/route.ts`)
```typescript
// Validates token and invoiceId, then calls server action
const result = await createPortalCheckoutSession(token, invoiceId)
```

### 3. Server Action (`lib/integrations/portal/actions/invoices.ts`)
```typescript
// Constructs URLs for Stripe
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
const successUrl = `${baseUrl}/portal/${token}/payment/success?session_id={CHECKOUT_SESSION_ID}`
const cancelUrl = `${baseUrl}/portal/${token}/payment/cancel?invoice_id=${invoiceId}`

// Creates Stripe Checkout session
const checkoutResult = await createCheckoutSession({
  invoiceId,
  amount: amountInCents,
  currency: invoice.currency.toLowerCase(),
  customerEmail: validation.clientEmail,
  description: `Invoice ${invoice.invoice_number ?? invoiceId}`,
  successUrl,
  cancelUrl,
  metadata: { ... }
})
```

### 4. Stripe Client (`lib/integrations/stripe/client.ts`)
```typescript
// Creates Stripe Checkout session via API
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  mode: 'payment',
  customer_email: params.customerEmail,
  line_items: [...],
  success_url: params.successUrl,
  cancel_url: params.cancelUrl,
  metadata: { ... }
})
```

---

## Potential Issues to Investigate

### 1. Stripe API Key Format
- Is the key valid? (starts with `sk_live_`)
- Is it the correct account?
- Has it been revoked or restricted?

### 2. URL Construction
- Is `NEXT_PUBLIC_SITE_URL` set correctly in Vercel?
- Does it include the protocol (https://)?
- Is there a trailing slash issue?
- Does the token contain special characters that break URL?

### 3. Invoice Data
- Is the invoice amount valid (> 0)?
- Is the currency valid for Stripe?
- Is the customer email valid?

### 4. Stripe Account Configuration
- Is the account fully activated for live payments?
- Are there geographic restrictions?
- Is checkout enabled?

---

## Root Cause Found

**Trailing newline characters in Vercel environment variables!**

When the env vars were set, they included `\n` at the end:
```
NEXT_PUBLIC_SITE_URL="https://jarve.com.au\n"   ← BROKEN
STRIPE_SECRET_KEY="sk_live_...\n"               ← BROKEN
```

This caused the success/cancel URLs sent to Stripe to be malformed:
```
https://jarve.com.au
/portal/{token}/payment/success...
```

Stripe rejected this as "not valid URL".

## Fix Applied

Removed and re-added all three env vars using `printf '%s'` to avoid trailing newlines:
```bash
vercel env rm NEXT_PUBLIC_SITE_URL production -y
printf '%s' 'https://jarve.com.au' | vercel env add NEXT_PUBLIC_SITE_URL production

vercel env rm STRIPE_SECRET_KEY production -y
printf '%s' 'sk_live_...' | vercel env add STRIPE_SECRET_KEY production

vercel env rm STRIPE_WEBHOOK_SECRET production -y
printf '%s' 'whsec_...' | vercel env add STRIPE_WEBHOOK_SECRET production
```

Then redeployed: `vercel --prod --yes`

## Next Steps

1. **Test Pay Now button again** - should work now
2. If still failing, check Stripe Dashboard for account status

---

## Console Logs from User

```
POST https://www.jarve.com.au/api/portal/invoices/checkout 400 (Bad Request)
```

The 400 status comes from our API route returning the Stripe error.

---

## Files Involved

| File | Purpose |
|------|---------|
| `.env.local` | Local environment variables |
| `lib/integrations/stripe/client.ts` | Stripe client and session creation |
| `lib/integrations/portal/actions/invoices.ts` | Portal checkout session logic |
| `app/api/portal/invoices/checkout/route.ts` | API endpoint |
| `app/portal/[token]/components/invoice-detail-modal.tsx` | Pay Now button UI |
