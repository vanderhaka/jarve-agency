-- ============================================================
-- Add payment status tracking for Stripe + UX improvements
-- ============================================================

-- Add payment status fields to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status_updated_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_payment_error TEXT;

-- Helpful index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);

-- Prevent duplicate Stripe payment intent records
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id_unique
  ON payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
